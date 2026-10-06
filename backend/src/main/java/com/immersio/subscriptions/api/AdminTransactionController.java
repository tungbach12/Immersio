package com.immersio.subscriptions.api;

import com.immersio.shared.dto.ApiResponse;
import com.immersio.subscriptions.api.dto.PaymentTransactionDto;
import com.immersio.subscriptions.service.AdminTransactionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Admin payment-transaction endpoints — port of the transaction routes of the .NET
 * {@code AdminController} ({@code GET /api/admin/transactions},
 * {@code POST /api/admin/transactions/{id}/approve}).
 */
@RestController
@RequestMapping("/api/admin/transactions")
@PreAuthorize("hasRole('Admin')")
public class AdminTransactionController {

    private final AdminTransactionService transactions;

    public AdminTransactionController(AdminTransactionService transactions) {
        this.transactions = transactions;
    }

    @GetMapping
    public ApiResponse<List<PaymentTransactionDto>> list() {
        return ApiResponse.successResult(transactions.getTransactions());
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<PaymentTransactionDto> approve(@PathVariable("id") UUID id) {
        return ApiResponse.successResult(transactions.approve(id), "Xác nhận thanh toán thành công.");
    }
}
