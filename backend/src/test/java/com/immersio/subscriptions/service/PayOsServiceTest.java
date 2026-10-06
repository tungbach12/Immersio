package com.immersio.subscriptions.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the PayOS client: signature canonicalization (verified against an independent
 * HMAC implementation and an RFC 4231 vector) plus the real HTTP contract, exercised against a
 * local stub server instead of api-merchant.payos.vn.
 */
class PayOsServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final String CLIENT_ID = "client-id-123";
    private static final String API_KEY = "api-key-456";
    private static final String CHECKSUM_KEY = "checksum-key-789";
    private static final String RETURN_URL = "https://app.immersio.vn/payment/payos-return";
    private static final String CANCEL_URL = "https://app.immersio.vn/student/subscription";

    private final List<RecordedRequest> requests = new CopyOnWriteArrayList<>();
    private HttpServer server;
    private String baseUrl;
    private String responseBody;
    private int responseStatus;

    @BeforeEach
    void startStubServer() throws IOException {
        requests.clear();
        responseStatus = 200;
        responseBody = "{}";
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v2/payment-requests", this::handle);
        server.createContext("/v2/payment-requests/", this::handle);
        server.start();
        baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
    }

    @AfterEach
    void stopStubServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    // ------------------------------------------------------------------ createPaymentLink

    @Test
    void createPaymentLinkPostsSignedRequestAndReturnsCheckoutUrl() throws IOException {
        responseBody = """
                {"code":"00","desc":"created","data":{"orderCode":1726100000001,"checkoutUrl":"https://pay.payos.vn/web/abc"}}
                """;
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        String url = service.createPaymentLink(1726100000001L, 69000, "IMMERSIO Plus", null, null);

        assertThat(url).isEqualTo("https://pay.payos.vn/web/abc");
        RecordedRequest request = singleRequest();
        assertThat(request.method()).isEqualTo("POST");
        assertThat(request.path()).isEqualTo("/v2/payment-requests");
        assertThat(request.clientId()).isEqualTo(CLIENT_ID);
        assertThat(request.apiKey()).isEqualTo(API_KEY);

        JsonNode body = MAPPER.readTree(request.body());
        assertThat(body.get("orderCode").asLong()).isEqualTo(1726100000001L);
        assertThat(body.get("amount").asInt()).isEqualTo(69000);
        assertThat(body.get("description").asText()).isEqualTo("IMMERSIO Plus");
        assertThat(body.get("returnUrl").asText()).isEqualTo(RETURN_URL);
        assertThat(body.get("cancelUrl").asText()).isEqualTo(CANCEL_URL);

        // Signature data must be the fields in alphabetical order.
        String signatureData = "amount=69000"
                + "&cancelUrl=" + CANCEL_URL
                + "&description=IMMERSIO Plus"
                + "&orderCode=1726100000001"
                + "&returnUrl=" + RETURN_URL;
        assertThat(body.get("signature").asText()).isEqualTo(hmac(CHECKSUM_KEY, signatureData));
    }

    @Test
    void createPaymentLinkFallsBackToReturnUrlWhenCancelUrlUnset() throws IOException {
        responseBody = """
                {"code":"00","data":{"checkoutUrl":"https://pay.payos.vn/web/x"}}
                """;
        PayOsService service = service(RETURN_URL, "");

        service.createPaymentLink(1L, 69000, "IMMERSIO Plus", null, null);

        JsonNode body = MAPPER.readTree(singleRequest().body());
        assertThat(body.get("cancelUrl").asText()).isEqualTo(RETURN_URL);
    }

    @Test
    void createPaymentLinkPrefersPerRequestUrls() throws IOException {
        responseBody = """
                {"code":"00","data":{"checkoutUrl":"https://pay.payos.vn/web/x"}}
                """;
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        service.createPaymentLink(1L, 69000, "IMMERSIO Plus",
                "https://mobile.app/return", "https://mobile.app/cancel");

        JsonNode body = MAPPER.readTree(singleRequest().body());
        assertThat(body.get("returnUrl").asText()).isEqualTo("https://mobile.app/return");
        assertThat(body.get("cancelUrl").asText()).isEqualTo("https://mobile.app/cancel");
    }

    @Test
    void createPaymentLinkFailsWhenPayOsRejectsRequest() {
        responseBody = """
                {"code":"01","desc":"Số dư không đủ","data":null}
                """;
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.createPaymentLink(1L, 69000, "IMMERSIO Plus", null, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PayOS create payment link failed: Số dư không đủ");
    }

    @Test
    void createPaymentLinkFailsWhenCheckoutUrlMissing() {
        responseBody = """
                {"code":"00","data":{"orderCode":1}}
                """;
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.createPaymentLink(1L, 69000, "IMMERSIO Plus", null, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PayOS did not return a checkout URL.");
    }

    @Test
    void createPaymentLinkFailsWhenCredentialsMissing() {
        PayOsService service = new PayOsService(baseUrl, "", API_KEY, CHECKSUM_KEY, RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.createPaymentLink(1L, 69000, "IMMERSIO Plus", null, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PayOS is not configured. Set PayOS:ClientId, PayOS:ApiKey and PayOS:ChecksumKey.");
        assertThat(requests).isEmpty();
    }

    @Test
    void createPaymentLinkFailsWhenReturnUrlMissing() {
        PayOsService service = new PayOsService(baseUrl, CLIENT_ID, API_KEY, CHECKSUM_KEY, " ", CANCEL_URL);

        assertThatThrownBy(() -> service.createPaymentLink(1L, 69000, "IMMERSIO Plus", null, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PayOS is not configured. Set PayOS:ReturnUrl.");
        assertThat(requests).isEmpty();
    }

    // ------------------------------------------------------------------ getPaymentStatus

    @Test
    void getPaymentStatusQueriesOrderAndParsesPaidStatus() {
        responseBody = """
                {"code":"00","desc":"Thành công","data":{"status":"PAID","amountPaid":69000}}
                """;
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        PayOsPaymentStatus status = service.getPaymentStatus(1726100000001L);

        assertThat(status.status()).isEqualTo("PAID");
        assertThat(status.amountPaid()).isEqualTo(69000L);

        RecordedRequest request = singleRequest();
        assertThat(request.method()).isEqualTo("GET");
        assertThat(request.path()).isEqualTo("/v2/payment-requests/1726100000001");
        assertThat(request.clientId()).isEqualTo(CLIENT_ID);
        assertThat(request.apiKey()).isEqualTo(API_KEY);
    }

    @Test
    void getPaymentStatusIsUnknownWhenDataMissing() {
        responseBody = """
                {"code":"01","desc":"not found"}
                """;
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        PayOsPaymentStatus status = service.getPaymentStatus(42L);

        assertThat(status.status()).isEqualTo("UNKNOWN");
        assertThat(status.amountPaid()).isZero();
    }

    // ------------------------------------------------------------------ verifyWebhook

    @Test
    void verifyWebhookAcceptsCorrectlySignedPayload() {
        // Canonical string built independently: keys alphabetically, key=value&...
        String signature = hmac(CHECKSUM_KEY,
                "amount=69000&code=00&description=IMMERSIO Plus"
                        + "&orderCode=1726100000001&status=PAID");
        String rawBody = """
                {"code":"00","desc":"success","success":true,
                 "data":{"orderCode":1726100000001,"code":"00","status":"PAID","amount":69000,"description":"IMMERSIO Plus"},
                 "signature":"%s"}""".formatted(signature);
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        PayOsWebhookData data = service.verifyWebhook(rawBody);

        assertThat(data.orderCode()).isEqualTo(1726100000001L);
        assertThat(data.code()).isEqualTo("00");
        assertThat(data.amount()).isEqualTo(69000L);
        assertThat(data.description()).isEqualTo("IMMERSIO Plus");
    }

    @Test
    void verifyWebhookRejectsTamperedPayload() {
        String signature = hmac(CHECKSUM_KEY,
                "amount=69000&code=00&description=IMMERSIO Plus"
                        + "&orderCode=1726100000001&status=PAID");
        String rawBody = """
                {"data":{"orderCode":1726100000001,"code":"00","status":"PAID","amount":999999,"description":"IMMERSIO Plus"},
                 "signature":"%s"}""".formatted(signature);
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.verifyWebhook(rawBody))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PayOS webhook signature mismatch.");
    }

    @Test
    void verifyWebhookRejectsMissingData() {
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.verifyWebhook("{\"code\":\"00\",\"signature\":\"abc\"}"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PayOS webhook missing data.");
    }

    @Test
    void verifyWebhookRejectsMissingSignature() {
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.verifyWebhook("{\"data\":{\"orderCode\":1}}"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PayOS webhook missing signature.");
    }

    @Test
    void verifyWebhookRejectsMalformedJson() {
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.verifyWebhook("<html>gateway error</html>"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void verifyWebhookRejectsEmptyPayload() {
        PayOsService service = service(RETURN_URL, CANCEL_URL);

        assertThatThrownBy(() -> service.verifyWebhook(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.verifyWebhook("  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ------------------------------------------------------------------ signatures

    @Test
    void canonicalQueryStringSortsKeysAndSerializesValuesLikeTheLegacyBackend() throws IOException {
        JsonNode data = MAPPER.readTree(
                "{\"z\":null,\"a\":true,\"m\":199000,\"b\":\"x y\",\"n\":false,\"o\":{\"k\":1}}");

        assertThat(PayOsService.canonicalQueryString(data))
                .isEqualTo("a=true&b=x y&m=199000&n=false&o={\"k\":1}&z=");
    }

    @Test
    void hmacSha256MatchesRfc4231Vector() {
        // RFC 4231 test case 2 (HMAC-SHA-256).
        assertThat(PayOsService.hmacSha256("Jefe", "what do ya want for nothing?"))
                .isEqualTo("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
    }

    // ------------------------------------------------------------------ helpers

    private PayOsService service(String returnUrl, String cancelUrl) {
        return new PayOsService(baseUrl, CLIENT_ID, API_KEY, CHECKSUM_KEY, returnUrl, cancelUrl);
    }

    private RecordedRequest singleRequest() {
        assertThat(requests).hasSize(1);
        return requests.get(0);
    }

    private void handle(HttpExchange exchange) throws IOException {
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        requests.add(new RecordedRequest(
                exchange.getRequestMethod(),
                exchange.getRequestURI().getPath(),
                exchange.getRequestHeaders().getFirst("x-client-id"),
                exchange.getRequestHeaders().getFirst("x-api-key"),
                body));

        byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(responseStatus, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    /** Independent HMAC implementation — deliberately not the production helper. */
    private static String hmac(String key, String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            List<String> hex = new ArrayList<>();
            for (byte b : digest) {
                hex.add(HexFormat.of().toHexDigits(b));
            }
            return String.join("", hex);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private record RecordedRequest(String method, String path, String clientId, String apiKey, String body) {
    }
}
