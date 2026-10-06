package com.immersio.upload.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure-logic tests for the Cloudinary signed-REST port: signature generation,
 * signed-param defaults, multipart request building and response parsing.
 *
 * <p>The expected signatures are SHA-1 vectors computed over the exact string
 * the CloudinaryDotNet 1.29.1 {@code SignParameters} builds
 * ({@code folder=...&timestamp=...&transformation=...} + API secret).</p>
 */
class CloudinaryServiceTest {

    private static final String SECRET = "test_secret";
    private static final String EXPECTED_SIGNATURE = "2fb7b9de9b00a74a036ea2970c30c83123864a9c";

    @Test
    void signsSortedParamsExcludingCredentialsAndFile() {
        Map<String, String> params = new HashMap<>();
        params.put("transformation", "f_auto,q_auto");
        params.put("timestamp", "1700000000");
        params.put("folder", "immersio/scenarios");
        params.put("api_key", "12345");
        params.put("file", "ignored-bytes");
        params.put("resource_type", "image");

        assertThat(CloudinaryService.computeSignature(params, SECRET)).isEqualTo(EXPECTED_SIGNATURE);
    }

    @Test
    void signsParamsBuiltForAnUploadWithDotNetVector() {
        SortedMap<String, String> params =
                CloudinaryService.buildSignedParams("immersio/scenarios", 1700000000L);

        assertThat(params).containsExactlyInAnyOrderEntriesOf(Map.of(
                "folder", "immersio/scenarios",
                "timestamp", "1700000000",
                "transformation", "f_auto,q_auto"));
        assertThat(CloudinaryService.computeSignature(params, SECRET)).isEqualTo(EXPECTED_SIGNATURE);
    }

    @Test
    void skipsNullParamValues() {
        Map<String, String> params = new HashMap<>();
        params.put("folder", "immersio/scenarios");
        params.put("timestamp", "1700000000");
        params.put("transformation", "f_auto,q_auto");
        params.put("eager", null);

        assertThat(CloudinaryService.computeSignature(params, SECRET)).isEqualTo(EXPECTED_SIGNATURE);
    }

    @Test
    void encodesAmpersandsLikeDotNetSignatureVersionTwo() {
        Map<String, String> params = Map.of(
                "folder", "a&b",
                "timestamp", "1700000000",
                "transformation", "f_auto,q_auto");

        assertThat(CloudinaryService.computeSignature(params, SECRET))
                .isEqualTo("8da408c6b4d1cd4f2e0ddcdc102b719b636db5c0");
    }

    @Test
    void defaultsBlankFolderToImmersioLikeDotNetService() {
        assertThat(CloudinaryService.buildSignedParams(null, 1L).get("folder")).isEqualTo("immersio");
        assertThat(CloudinaryService.buildSignedParams("   ", 1L).get("folder")).isEqualTo("immersio");
        assertThat(CloudinaryService.buildSignedParams("immersio/avatars", 1L).get("folder"))
                .isEqualTo("immersio/avatars");
    }

    @Test
    void buildsMultipartBodyWithSignedFieldsAndFilePart() {
        SortedMap<String, String> fields = new TreeMap<>();
        fields.put("api_key", "12345");
        fields.put("folder", "immersio/scenarios");
        fields.put("signature", "abcdef");
        fields.put("timestamp", "1700000000");
        fields.put("transformation", "f_auto,q_auto");

        byte[] body = CloudinaryService.buildMultipartBody(
                "BOUNDARY", "cat.png", "PNG!".getBytes(StandardCharsets.UTF_8), fields);
        String text = new String(body, StandardCharsets.UTF_8);

        assertThat(text).contains("--BOUNDARY\r\n");
        assertThat(text).contains("name=\"api_key\"\r\n\r\n12345\r\n");
        assertThat(text).contains("name=\"folder\"\r\n\r\nimmersio/scenarios\r\n");
        assertThat(text).contains("name=\"signature\"\r\n\r\nabcdef\r\n");
        assertThat(text).contains("name=\"timestamp\"\r\n\r\n1700000000\r\n");
        assertThat(text).contains("name=\"transformation\"\r\n\r\nf_auto,q_auto\r\n");
        assertThat(text).contains("name=\"file\"; filename=\"cat.png\"\r\n");
        assertThat(text).contains("Content-Type: application/octet-stream\r\n\r\nPNG!\r\n");
        assertThat(text).endsWith("--BOUNDARY--\r\n");
    }

    @Test
    void sanitizesFileNamesAgainstHeaderInjection() {
        assertThat(CloudinaryService.sanitizeFileName("evil\"\r\nX-Injected: 1"))
                .isEqualTo("evilX-Injected: 1");
        assertThat(CloudinaryService.sanitizeFileName(null)).isEqualTo("upload");
        assertThat(CloudinaryService.sanitizeFileName("  ")).isEqualTo("upload");
        assertThat(CloudinaryService.sanitizeFileName("cat.png")).isEqualTo("cat.png");
    }

    @Test
    void failsClearlyWhenNotConfigured() {
        CloudinaryService service = new CloudinaryService("", " ", "", 1000);

        assertThatThrownBy(() -> service.uploadImage(new byte[] {1}, "a.png", "immersio"))
                .isInstanceOf(CloudinaryUploadException.class)
                .hasMessageContaining("Cloudinary is not configured")
                .hasMessageContaining("cloudinary.cloud-name")
                .hasMessageContaining("Cloudinary__ApiSecret");
    }

    @Test
    void parsesSecureUrlFromSuccessfulResponse() {
        String body = "{\"public_id\":\"immersio/scenarios/cat\",\"version\":1781879119,"
                + "\"secure_url\":\"https://res.cloudinary.com/demo/image/upload/v1781879119/"
                + "immersio/scenarios/cat.png\"}";

        assertThat(CloudinaryService.parseUploadResponse(200, body))
                .isEqualTo("https://res.cloudinary.com/demo/image/upload/v1781879119/"
                        + "immersio/scenarios/cat.png");
    }

    @Test
    void surfacesCloudinaryErrorMessageVerbatim() {
        String body = "{\"error\":{\"message\":\"Invalid Signature\"}}";

        assertThatThrownBy(() -> CloudinaryService.parseUploadResponse(401, body))
                .isInstanceOf(CloudinaryUploadException.class)
                .hasMessage("Cloudinary upload failed: Invalid Signature");
    }

    @Test
    void failsWhenResponseCarriesNoUrl() {
        assertThatThrownBy(() -> CloudinaryService.parseUploadResponse(200, "{}"))
                .isInstanceOf(CloudinaryUploadException.class)
                .hasMessage("Cloudinary returned no URL.");
    }

    @Test
    void failsOnUnreadableResponse() {
        assertThatThrownBy(() -> CloudinaryService.parseUploadResponse(502, "<html>Bad Gateway</html>"))
                .isInstanceOf(CloudinaryUploadException.class)
                .hasMessage("Cloudinary upload failed: HTTP 502 (unreadable response).");
    }
}
