package com.immersio.subscriptions.service;

import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.subscriptions.api.dto.PaymentTransactionDto;
import com.immersio.subscriptions.domain.PaymentTransaction;
import com.immersio.subscriptions.repository.PaymentTransactionRepository;
import com.immersio.users.domain.User;
import com.immersio.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Tests for the admin transaction list/approve flows ported from the .NET {@code AdminService}. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminTransactionServiceTest {

    private static final UUID OWNER_ID = UUID.fromString("11111111-2222-3333-4444-555566667777");

    @Mock
    private PaymentTransactionRepository payments;

    @Mock
    private UserRepository users;

    @InjectMocks
    private AdminTransactionService service;

    @Captor
    private ArgumentCaptor<Iterable<UUID>> ownerIds;

    @Test
    void getTransactionsOrdersByCreatedAtDescending() {
        when(payments.findAll(any(Sort.class))).thenReturn(List.of());

        service.getTransactions();

        ArgumentCaptor<Sort> sort = ArgumentCaptor.forClass(Sort.class);
        verify(payments).findAll(sort.capture());
        Sort.Order createdAt = sort.getValue().getOrderFor("createdAt");
        assertThat(createdAt).isNotNull();
        assertThat(createdAt.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void getTransactionsRendersMissingOwnerLikeTheLegacyBackend() {
        PaymentTransaction withOwner = new PaymentTransaction("1001", OWNER_ID, "Plus", "monthly", 69_000L);
        PaymentTransaction orphan = new PaymentTransaction("1002",
                UUID.fromString("99999999-8888-7777-6666-555544443333"), "Premium", "yearly", 1_910_400L);
        User owner = userWithId(OWNER_ID, "alice", "alice@example.com");

        when(payments.findAll(any(Sort.class))).thenReturn(List.of(withOwner, orphan));
        when(users.findAllById(any())).thenReturn(List.of(owner));

        List<PaymentTransactionDto> result = service.getTransactions();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).username()).isEqualTo("alice");
        assertThat(result.get(0).email()).isEqualTo("alice@example.com");
        assertThat(result.get(1).username()).isEqualTo("Deleted User");
        assertThat(result.get(1).email()).isEqualTo("N/A");
        assertThat(result.get(0).txnRef()).isEqualTo("1001");
        assertThat(result.get(0).amount()).isEqualTo(69_000L);
        assertThat(result.get(0).status()).isEqualTo("Pending");

        verify(users).findAllById(ownerIds.capture());
        List<UUID> requested = new ArrayList<>();
        ownerIds.getValue().forEach(requested::add);
        assertThat(requested).containsExactlyInAnyOrder(OWNER_ID,
                UUID.fromString("99999999-8888-7777-6666-555544443333"));
    }

    @Test
    void approveMarksPaidAndActivatesMonthlySubscription() {
        PaymentTransaction transaction = new PaymentTransaction("2001", OWNER_ID, "Plus", "monthly", 69_000L);
        User owner = new User("alice", "alice@example.com", "hash");
        when(payments.findById(any(UUID.class))).thenReturn(Optional.of(transaction));
        when(users.findById(OWNER_ID)).thenReturn(Optional.of(owner));

        PaymentTransactionDto dto = service.approve(UUID.randomUUID());

        assertThat(dto.status()).isEqualTo("Paid");
        assertThat(dto.txnRef()).isEqualTo("2001");
        assertThat(dto.username()).isEqualTo("alice");
        assertThat(dto.email()).isEqualTo("alice@example.com");
        assertThat(transaction.getVnpTransactionNo()).isEqualTo("ADMIN_MANUAL");
        assertThat(transaction.getResponseCode()).isEqualTo("00");
        assertThat(transaction.getPaidAt()).isNotNull();
        assertThat(owner.getSubscriptionTier()).isEqualTo("Plus");
        // .NET AdminService.ApproveTransactionAsync: monthly = AddMonths(1) (calendar month)
        assertThat(owner.getSubscriptionExpiresAt())
                .isBetween(Instant.now().atZone(java.time.ZoneOffset.UTC).plusMonths(1).minusMinutes(5).toInstant(),
                        Instant.now().atZone(java.time.ZoneOffset.UTC).plusMonths(1).plusMinutes(5).toInstant());
    }

    @Test
    void approveExtendsYearlySubscriptionByOneYear() {
        PaymentTransaction transaction = new PaymentTransaction("2002", OWNER_ID, "Premium", "yearly", 1_910_400L);
        User owner = new User("alice", "alice@example.com", "hash");
        when(payments.findById(any(UUID.class))).thenReturn(Optional.of(transaction));
        when(users.findById(OWNER_ID)).thenReturn(Optional.of(owner));

        service.approve(UUID.randomUUID());

        assertThat(owner.getSubscriptionTier()).isEqualTo("Premium");
        assertThat(owner.getSubscriptionExpiresAt())
                .isBetween(Instant.now().plus(365, ChronoUnit.DAYS).minus(5, ChronoUnit.MINUTES),
                        Instant.now().plus(365, ChronoUnit.DAYS).plus(5, ChronoUnit.MINUTES));
    }

    @Test
    void approveRendersDeletedOwnerAsUnknownUser() {
        PaymentTransaction transaction = new PaymentTransaction("2003", OWNER_ID, "Plus", "monthly", 69_000L);
        User deleted = new User("ghost", "ghost@example.com", "hash");
        deleted.softDelete();
        when(payments.findById(any(UUID.class))).thenReturn(Optional.of(transaction));
        when(users.findById(OWNER_ID)).thenReturn(Optional.of(deleted));

        PaymentTransactionDto dto = service.approve(UUID.randomUUID());

        assertThat(dto.username()).isEqualTo("Unknown User");
        assertThat(dto.email()).isEqualTo("N/A");
        assertThat(dto.status()).isEqualTo("Paid");
        assertThat(deleted.getSubscriptionTier()).isEqualTo("Basic"); // untouched
    }

    @Test
    void approveRendersMissingOwnerAsUnknownUser() {
        PaymentTransaction transaction = new PaymentTransaction("2004", OWNER_ID, "Plus", "monthly", 69_000L);
        when(payments.findById(any(UUID.class))).thenReturn(Optional.of(transaction));
        when(users.findById(OWNER_ID)).thenReturn(Optional.empty());

        PaymentTransactionDto dto = service.approve(UUID.randomUUID());

        assertThat(dto.username()).isEqualTo("Unknown User");
        assertThat(dto.email()).isEqualTo("N/A");
        assertThat(dto.status()).isEqualTo("Paid");
    }

    @Test
    void approveUnknownTransactionFailsWithLegacyMessage() {
        when(payments.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.approve(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Transaction not found.");
    }


    /**
     * The JPA {@code @Id} is generated on persist — a plain {@code new User(...)} has a null id,
     * which would never match the transaction's owner id. Tests seed it reflectively.
     */
    private static User userWithId(UUID id, String username, String email) {
        try {
            User user = new User(username, email, "hash");
            var field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
            return user;
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
