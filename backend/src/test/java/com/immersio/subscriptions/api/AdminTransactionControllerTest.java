package com.immersio.subscriptions.api;

import com.immersio.shared.exception.GlobalExceptionHandler;
import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.subscriptions.api.dto.PaymentTransactionDto;
import com.immersio.subscriptions.service.AdminTransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP contract tests for the admin transaction endpoints — the field names are exactly what
 * {@code immersioFe/src/services/admin.ts} parses.
 */
class AdminTransactionControllerTest {

    private AdminTransactionService transactions;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        transactions = mock(AdminTransactionService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AdminTransactionController(transactions))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new StringHttpMessageConverter(), new JacksonJsonHttpMessageConverter())
                .build();
    }

    @Test
    void listReturnsEnvelopeWithLegacyFieldNames() throws Exception {
        UUID userId = UUID.fromString("11111111-2222-3333-4444-555566667777");
        when(transactions.getTransactions()).thenReturn(List.of(
                new PaymentTransactionDto(UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
                        "1726100000001", userId, "alice", "alice@example.com",
                        "Plus", "monthly", 69_000L, "Pending", Instant.parse("2026-10-01T10:15:30Z"), null)));

        mockMvc.perform(get("/api/admin/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"))
                .andExpect(jsonPath("$.data[0].txnRef").value("1726100000001"))
                .andExpect(jsonPath("$.data[0].userId").value(userId.toString()))
                .andExpect(jsonPath("$.data[0].username").value("alice"))
                .andExpect(jsonPath("$.data[0].email").value("alice@example.com"))
                .andExpect(jsonPath("$.data[0].tier").value("Plus"))
                .andExpect(jsonPath("$.data[0].billingCycle").value("monthly"))
                .andExpect(jsonPath("$.data[0].amount").value(69_000))
                .andExpect(jsonPath("$.data[0].status").value("Pending"))
                .andExpect(jsonPath("$.data[0].createdAt").value("2026-10-01T10:15:30Z"))
                .andExpect(jsonPath("$.data[0].paidAt").doesNotExist());
    }

    @Test
    void approveReturnsUpdatedTransactionWithLegacyMessage() throws Exception {
        UUID transactionId = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        when(transactions.approve(any(UUID.class))).thenReturn(
                new PaymentTransactionDto(transactionId, "1726100000001",
                        UUID.fromString("11111111-2222-3333-4444-555566667777"),
                        "alice", "alice@example.com", "Plus", "monthly", 69_000L, "Paid",
                        Instant.parse("2026-10-01T10:15:30Z"), Instant.parse("2026-10-02T08:00:00Z")));

        mockMvc.perform(post("/api/admin/transactions/" + transactionId + "/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Xác nhận thanh toán thành công."))
                .andExpect(jsonPath("$.data.status").value("Paid"))
                .andExpect(jsonPath("$.data.paidAt").value("2026-10-02T08:00:00Z"));
    }

    @Test
    void approveUnknownTransactionReturns404Envelope() throws Exception {
        when(transactions.approve(any(UUID.class)))
                .thenThrow(new ResourceNotFoundException("Transaction not found."));

        mockMvc.perform(post("/api/admin/transactions/" + UUID.randomUUID() + "/approve"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Transaction not found."));
    }
}
