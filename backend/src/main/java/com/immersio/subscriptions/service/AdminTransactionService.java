package com.immersio.subscriptions.service;

import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.subscriptions.api.dto.PaymentTransactionDto;
import com.immersio.subscriptions.domain.PaymentTransaction;
import com.immersio.subscriptions.repository.PaymentTransactionRepository;
import com.immersio.users.domain.User;
import com.immersio.users.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Admin payment-transaction endpoints — port of the transaction half of the .NET {@code AdminService}.
 */
@Service
public class AdminTransactionService {

    private final PaymentTransactionRepository payments;
    private final UserRepository users;

    public AdminTransactionService(PaymentTransactionRepository payments, UserRepository users) {
        this.payments = payments;
        this.users = users;
    }

    /** Newest first, with soft-deleted/missing owners rendered like the legacy backend did. */
    @Transactional(readOnly = true)
    public List<PaymentTransactionDto> getTransactions() {
        List<PaymentTransaction> transactions = payments.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        Map<UUID, User> owners = users.findAllById(ownerIds(transactions)).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return transactions.stream()
                .map(transaction -> toDto(transaction, owners.get(transaction.getUserId()),
                        "Deleted User", "N/A"))
                .toList();
    }

    /** Manual approval: marks the row Paid (ADMIN_MANUAL) and activates the buyer's subscription. */
    @Transactional
    public PaymentTransactionDto approve(UUID transactionId) {
        PaymentTransaction transaction = payments.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));
        transaction.markPaid("ADMIN_MANUAL", "00");

        User user = users.findById(transaction.getUserId()).filter(owner -> !owner.isDeleted()).orElse(null);
        if (user != null) {
            Instant now = Instant.now();
            // Legacy behaviour: yearly = +1 year, monthly = +1 month.
            Instant expiresAt = "yearly".equalsIgnoreCase(transaction.getBillingCycle())
                    ? now.atZone(ZoneOffset.UTC).plusYears(1).toInstant()
                    : now.atZone(ZoneOffset.UTC).plusMonths(1).toInstant();
            user.updateSubscription(transaction.getTier(), expiresAt);
            users.save(user);
        }
        payments.save(transaction);

        return toDto(transaction, user, "Unknown User", "N/A");
    }

    private static LinkedHashSet<UUID> ownerIds(List<PaymentTransaction> transactions) {
        LinkedHashSet<UUID> ids = new LinkedHashSet<>();
        transactions.forEach(transaction -> ids.add(transaction.getUserId()));
        return ids;
    }

    private static PaymentTransactionDto toDto(PaymentTransaction transaction, User user,
                                               String missingUsername, String missingEmail) {
        return new PaymentTransactionDto(
                transaction.getId(),
                transaction.getTxnRef(),
                transaction.getUserId(),
                user != null ? user.getUsername() : missingUsername,
                user != null ? user.getEmail() : missingEmail,
                transaction.getTier(),
                transaction.getBillingCycle(),
                transaction.getAmount(),
                transaction.getStatus(),
                transaction.getCreatedAt(),
                transaction.getPaidAt());
    }
}
