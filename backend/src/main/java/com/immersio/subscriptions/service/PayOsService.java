package com.immersio.subscriptions.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * PayOS merchant API client (port of the .NET {@code Immersio.Infrastructure.Services.PayOsService}).
 *
 * <p>All outbound calls are signed with HMAC-SHA256 over a canonical query string built from the
 * data keys sorted ordinally and serialized as {@code key=value&...}, exactly as PayOS specifies
 * and as the legacy backend implemented it.</p>
 *
 * <p>Configuration (all optional so the application boots unconfigured; calls fail at runtime with
 * the same messages the legacy backend produced):</p>
 * <ul>
 *   <li>{@code payos.base-url} (default {@value #DEFAULT_BASE_URL})</li>
 *   <li>{@code payos.client-id} — PayOS {@code x-client-id} header</li>
 *   <li>{@code payos.api-key} — PayOS {@code x-api-key} header</li>
 *   <li>{@code payos.checksum-key} — HMAC key for request/webhook signatures</li>
 *   <li>{@code payos.return-url} — default browser return URL</li>
 *   <li>{@code payos.cancel-url} — default browser cancel URL (falls back to the return URL)</li>
 * </ul>
 */
@Service
public class PayOsService {

    /** Same endpoint the legacy backend hardcoded. */
    private static final String DEFAULT_BASE_URL = "https://api-merchant.payos.vn";

    private static final String CREATE_PATH = "/v2/payment-requests";
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient restClient;
    private final String clientId;
    private final String apiKey;
    private final String checksumKey;
    private final String returnUrl;
    private final String cancelUrl;

    public PayOsService(
            @Value("${payos.base-url:" + DEFAULT_BASE_URL + "}") String baseUrl,
            @Value("${payos.client-id:}") String clientId,
            @Value("${payos.api-key:}") String apiKey,
            @Value("${payos.checksum-key:}") String checksumKey,
            @Value("${payos.return-url:}") String returnUrl,
            @Value("${payos.cancel-url:}") String cancelUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl == null || baseUrl.isBlank() ? DEFAULT_BASE_URL : baseUrl)
                .build();
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.checksumKey = checksumKey;
        this.returnUrl = returnUrl;
        this.cancelUrl = cancelUrl;
    }

    /**
     * Creates a hosted PayOS checkout link (VietQR) and returns its URL.
     *
     * @param overrideReturnUrl optional per-request return URL (mobile deep links); {@code null} uses {@code payos.return-url}
     * @param overrideCancelUrl optional per-request cancel URL; {@code null} uses {@code payos.cancel-url} then the return URL
     * @throws IllegalStateException when PayOS is not configured or PayOS rejects the request
     */
    public String createPaymentLink(long orderCode, int amount, String description,
                                    String overrideReturnUrl, String overrideCancelUrl) {
        Credentials credentials = credentials();

        String effectiveReturnUrl = overrideReturnUrl != null ? overrideReturnUrl : returnUrl;
        if (effectiveReturnUrl == null || effectiveReturnUrl.isBlank()) {
            throw new IllegalStateException("PayOS is not configured. Set PayOS:ReturnUrl.");
        }
        String effectiveCancelUrl;
        if (overrideCancelUrl != null) {
            effectiveCancelUrl = overrideCancelUrl;
        } else {
            effectiveCancelUrl = cancelUrl == null || cancelUrl.isBlank() ? effectiveReturnUrl : cancelUrl;
        }

        // Signature data must be the fields in alphabetical order.
        String signatureData = "amount=" + amount
                + "&cancelUrl=" + effectiveCancelUrl
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + effectiveReturnUrl;
        String signature = hmacSha256(credentials.checksumKey(), signatureData);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("orderCode", orderCode);
        payload.put("amount", amount);
        payload.put("description", description);
        payload.put("cancelUrl", effectiveCancelUrl);
        payload.put("returnUrl", effectiveReturnUrl);
        payload.put("signature", signature);

        String json = restClient.post()
                .uri(CREATE_PATH)
                .header("x-client-id", credentials.clientId())
                .header("x-api-key", credentials.apiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(writeJson(payload))
                // Read the body regardless of HTTP status, like the legacy HttpClient did, so the
                // PayOS business code below decides success/failure.
                .exchange((request, response) -> response.bodyTo(String.class));

        JsonNode root = parse(json);
        String code = textOrNull(root.get("code"));
        JsonNode data = root.get("data");
        if (!"00".equals(code) || data == null || !data.isObject()) {
            String desc = textOrNull(root.get("desc"));
            throw new IllegalStateException("PayOS create payment link failed: "
                    + (desc != null ? desc : "Unknown error"));
        }
        String checkoutUrl = textOrNull(data.get("checkoutUrl"));
        if (checkoutUrl == null || checkoutUrl.isEmpty()) {
            throw new IllegalStateException("PayOS did not return a checkout URL.");
        }
        return checkoutUrl;
    }

    /** Queries PayOS for the authoritative status of an order (PAID / PENDING / CANCELLED / ...). */
    public PayOsPaymentStatus getPaymentStatus(long orderCode) {
        Credentials credentials = credentials();

        String json = restClient.get()
                .uri(CREATE_PATH + "/{orderCode}", orderCode)
                .header("x-client-id", credentials.clientId())
                .header("x-api-key", credentials.apiKey())
                .exchange((request, response) -> response.bodyTo(String.class));

        JsonNode root = parse(json);
        JsonNode data = root.get("data");
        if (data == null || !data.isObject()) {
            return new PayOsPaymentStatus("UNKNOWN", 0);
        }
        String status = textOrNull(data.get("status"));
        JsonNode amountPaid = data.get("amountPaid");
        long paid = amountPaid != null && amountPaid.isIntegralNumber() ? amountPaid.longValue() : 0;
        return new PayOsPaymentStatus(status != null ? status : "UNKNOWN", paid);
    }

    /**
     * Verifies a PayOS webhook/IPN payload and returns the inner webhook data object when the HMAC
     * signature matches. PayOS sends:
     * <pre>{ "code": "00", "desc": "...", "success": true, "data": {...}, "signature": "..." }</pre>
     * The signature is {@code HMAC-SHA256(checksumKey, sorted-data-query-string)} where the data keys
     * are sorted alphabetically and serialized as {@code key=value&...}.
     *
     * @throws IllegalStateException when the payload is malformed or the signature does not verify
     * @throws IllegalArgumentException when the payload is not valid JSON
     */
    public PayOsWebhookData verifyWebhook(String rawBody) {
        JsonNode root = parse(rawBody);
        JsonNode data = root.get("data");
        if (data == null || !data.isObject()) {
            throw new IllegalStateException("PayOS webhook missing data.");
        }
        String signature = textOrNull(root.get("signature"));
        if (signature == null || signature.isBlank()) {
            throw new IllegalStateException("PayOS webhook missing signature.");
        }

        String expected = signObject(data, credentials().checksumKey());
        if (!expected.equals(signature)) {
            throw new IllegalStateException("PayOS webhook signature mismatch.");
        }

        JsonNode orderCode = data.get("orderCode");
        // PayOS webhook data uses the transaction "code" field ("00" = success), NOT a "status" field.
        String code = textOrNull(data.get("code"));
        JsonNode amount = data.get("amount");
        String description = textOrNull(data.get("description"));

        return new PayOsWebhookData(
                orderCode != null && orderCode.isIntegralNumber() ? orderCode.longValue() : 0,
                code != null ? code : "",
                amount != null && amount.isIntegralNumber() ? amount.longValue() : 0,
                description != null ? description : "");
    }

    /**
     * Canonical query string used by PayOS signatures: keys sorted ordinally, values serialized as
     * {@code key=value&...} (nulls as empty strings, booleans as {@code true}/{@code false},
     * numbers and nested structures as raw JSON text).
     */
    static String canonicalQueryString(JsonNode data) {
        List<String> names = new ArrayList<>();
        data.fieldNames().forEachRemaining(names::add);
        names.sort(Comparator.naturalOrder());
        return names.stream()
                .map(name -> name + "=" + serializeValue(data.get(name)))
                .collect(Collectors.joining("&"));
    }

    /** HMAC-SHA256 as lowercase hex — identical output to the legacy implementation. */
    static String hmacSha256(String key, String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable.", ex);
        }
    }

    static String signObject(JsonNode data, String checksumKey) {
        return hmacSha256(checksumKey, canonicalQueryString(data));
    }

    private static String serializeValue(JsonNode value) {
        if (value == null || value.isNull()) {
            return "";
        }
        if (value.isTextual()) {
            return value.asText();
        }
        if (value.isBoolean()) {
            return String.valueOf(value.booleanValue());
        }
        // Numbers and arrays/objects serialize to raw JSON text.
        return value.toString();
    }

    private static JsonNode parse(String json) {
        if (json == null || json.isBlank()) {
            throw new IllegalArgumentException("Empty JSON payload.");
        }
        try {
            JsonNode root = JSON.readTree(json);
            if (root == null) {
                throw new IllegalArgumentException("Empty JSON payload.");
            }
            return root;
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Malformed JSON payload.", ex);
        }
    }

    private static String writeJson(Map<String, Object> payload) {
        try {
            return JSON.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to serialize PayOS request.", ex);
        }
    }

    /** {@code null} for missing/null JSON values, otherwise the scalar text. */
    private static String textOrNull(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        return node.asText();
    }

    private Credentials credentials() {
        if (clientId == null || clientId.isBlank()
                || apiKey == null || apiKey.isBlank()
                || checksumKey == null || checksumKey.isBlank()) {
            throw new IllegalStateException(
                    "PayOS is not configured. Set PayOS:ClientId, PayOS:ApiKey and PayOS:ChecksumKey.");
        }
        return new Credentials(clientId, apiKey, checksumKey);
    }

    private record Credentials(String clientId, String apiKey, String checksumKey) {
    }
}
