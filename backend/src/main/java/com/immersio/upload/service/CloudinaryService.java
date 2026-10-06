package com.immersio.upload.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Uploads images to Cloudinary using signed REST calls
 * ({@code POST https://api.cloudinary.com/v1_1/<cloud>/image/upload},
 * multipart/form-data) — no Cloudinary SDK, so it is pure JDK code and runs on
 * any platform, including linux/arm64 Docker images.
 *
 * <p>Wire format and signature match the legacy .NET {@code CloudinaryService}
 * (CloudinaryDotNet 1.29.1):</p>
 * <ul>
 *   <li>signed params: {@code folder}, {@code timestamp}, {@code transformation} —
 *       sorted, with {@code api_key}/{@code file}/{@code resource_type} excluded —
 *       SHA-1 hex of {@code k1=v1&k2=v2<apiSecret>} ({@code &} in values encoded
 *       as {@code %26}, signature version 2);</li>
 *   <li>{@code overwrite} is NOT sent: {@code ImageUploadParams} resets the
 *       {@code RawUploadParams} default to null;</li>
 *   <li>{@code transformation} is {@code f_auto,q_auto} — what
 *       {@code new Transformation().Quality("auto").FetchFormat("auto")}
 *       generates — so Cloudinary auto-picks best format/quality before saving;</li>
 *   <li>a {@code Basic base64(apiKey:apiSecret)} Authorization header is sent
 *       alongside the signature, exactly like the .NET SDK;</li>
 *   <li>a blank folder falls back to {@code immersio} (the .NET service default).</li>
 * </ul>
 *
 * <p>Configuration (graceful empty defaults — the application boots
 * unconfigured; uploads fail at runtime with a clear message):</p>
 * <ul>
 *   <li>{@code cloudinary.cloud-name} — also resolves {@code CLOUDINARY_CLOUD_NAME};
 *       legacy env {@code Cloudinary__CloudName} is honoured as fallback</li>
 *   <li>{@code cloudinary.api-key} — also resolves {@code CLOUDINARY_API_KEY};
 *       legacy env {@code Cloudinary__ApiKey} is honoured as fallback</li>
 *   <li>{@code cloudinary.api-secret} — also resolves {@code CLOUDINARY_API_SECRET};
 *       legacy env {@code Cloudinary__ApiSecret} is honoured as fallback</li>
 *   <li>{@code cloudinary.upload-timeout-ms} — default {@code 100000}
 *       (the .NET HttpClient default of 100 s)</li>
 * </ul>
 */
@Service
public class CloudinaryService implements ImageUploadService {

    static final String UPLOAD_URL_TEMPLATE = "https://api.cloudinary.com/v1_1/%s/image/upload";

    /** Same as .NET {@code new Transformation().Quality("auto").FetchFormat("auto")}. */
    static final String UPLOAD_TRANSFORMATION = "f_auto,q_auto";

    /** Same as the .NET CloudinaryService fallback when the folder is blank. */
    static final String DEFAULT_FOLDER = "immersio";

    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);

    /** Params never included in the Cloudinary signature (.NET SignParameters). */
    private static final Set<String> SIGNATURE_EXCLUDED = Set.of("api_key", "file", "resource_type");

    private static final String FILE_CONTENT_TYPE = "application/octet-stream";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final long uploadTimeoutMs;
    private final HttpClient http;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name:${Cloudinary__CloudName:}}") String cloudName,
            @Value("${cloudinary.api-key:${Cloudinary__ApiKey:}}") String apiKey,
            @Value("${cloudinary.api-secret:${Cloudinary__ApiSecret:}}") String apiSecret,
            @Value("${cloudinary.upload-timeout-ms:100000}") long uploadTimeoutMs) {
        this.cloudName = cloudName == null ? "" : cloudName.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.apiSecret = apiSecret == null ? "" : apiSecret.trim();
        this.uploadTimeoutMs = uploadTimeoutMs;
        this.http = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();
    }

    // ------------------------------------------------------------------
    // Public operations
    // ------------------------------------------------------------------

    @Override
    public String uploadImage(byte[] content, String fileName, String folder) {
        requireConfigured();

        long timestamp = Instant.now().getEpochSecond();
        SortedMap<String, String> signed = buildSignedParams(folder, timestamp);

        SortedMap<String, String> form = new TreeMap<>(signed);
        form.put("api_key", apiKey);
        form.put("signature", computeSignature(signed, apiSecret));

        String boundary = "--------------------------" + UUID.randomUUID().toString().replace("-", "");
        byte[] body = buildMultipartBody(boundary, fileName, content, form);

        HttpRequest request = HttpRequest.newBuilder(URI.create(String.format(UPLOAD_URL_TEMPLATE, cloudName)))
                .timeout(Duration.ofMillis(uploadTimeoutMs))
                .header("Authorization", basicAuth(apiKey, apiSecret))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<byte[]> response;
        try {
            response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new CloudinaryUploadException("Cloudinary upload was interrupted.", ex);
        } catch (IOException ex) {
            throw new CloudinaryUploadException("Cloudinary upload failed: " + ex.getMessage(), ex);
        }

        String responseBody = new String(response.body(), StandardCharsets.UTF_8);
        return parseUploadResponse(response.statusCode(), responseBody);
    }

    private void requireConfigured() {
        if (cloudName.isEmpty() || apiKey.isEmpty() || apiSecret.isEmpty()) {
            throw new CloudinaryUploadException(
                    "Cloudinary is not configured. Set cloudinary.cloud-name, cloudinary.api-key and "
                            + "cloudinary.api-secret (env: Cloudinary__CloudName, Cloudinary__ApiKey, "
                            + "Cloudinary__ApiSecret).");
        }
    }

    // ------------------------------------------------------------------
    // Signing, request building and response parsing (unit tested)
    // ------------------------------------------------------------------

    /**
     * Params that go into the Cloudinary signature: {@code folder} (defaulting to
     * {@code immersio} for blank input), {@code timestamp} and {@code transformation}.
     */
    static SortedMap<String, String> buildSignedParams(String folder, long timestamp) {
        SortedMap<String, String> params = new TreeMap<>();
        params.put("folder", isBlank(folder) ? DEFAULT_FOLDER : folder);
        params.put("timestamp", String.valueOf(timestamp));
        params.put("transformation", UPLOAD_TRANSFORMATION);
        return params;
    }

    /**
     * Cloudinary request signature: sorted {@code key=value} pairs joined by
     * {@code &} (skipping {@code api_key}, {@code file}, {@code resource_type} and
     * null values; {@code &} in values encoded as {@code %26}), the API secret
     * appended, then SHA-1 hex. Matches the .NET {@code SignParameters} exactly.
     */
    static String computeSignature(Map<String, String> params, String apiSecret) {
        StringBuilder toSign = new StringBuilder();
        for (Map.Entry<String, String> entry : new TreeMap<>(params).entrySet()) {
            String value = entry.getValue();
            if (value == null || SIGNATURE_EXCLUDED.contains(entry.getKey())) {
                continue;
            }
            if (!toSign.isEmpty()) {
                toSign.append('&');
            }
            toSign.append(entry.getKey()).append('=').append(value.replace("&", "%26"));
        }
        toSign.append(apiSecret);
        return sha1Hex(toSign.toString());
    }

    /** Builds the multipart/form-data body: text fields (sorted) plus the file part. */
    static byte[] buildMultipartBody(String boundary, String fileName, byte[] content,
            SortedMap<String, String> fields) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(content.length + 1024);
        for (Map.Entry<String, String> field : fields.entrySet()) {
            write(out, "--" + boundary + "\r\n");
            write(out, "Content-Disposition: form-data; name=\"" + field.getKey() + "\"\r\n\r\n");
            write(out, field.getValue() + "\r\n");
        }
        write(out, "--" + boundary + "\r\n");
        write(out, "Content-Disposition: form-data; name=\"file\"; filename=\""
                + sanitizeFileName(fileName) + "\"\r\n");
        write(out, "Content-Type: " + FILE_CONTENT_TYPE + "\r\n\r\n");
        out.writeBytes(content);
        write(out, "\r\n");
        write(out, "--" + boundary + "--\r\n");
        return out.toByteArray();
    }

    /** Keeps the multipart filename single-line and quote-free (header injection guard). */
    static String sanitizeFileName(String fileName) {
        if (isBlank(fileName)) {
            return "upload";
        }
        return fileName.replace("\r", "").replace("\n", "").replace("\"", "");
    }

    /**
     * Interprets a Cloudinary upload response the way the .NET SDK does: an
     * {@code error} object fails the upload, otherwise {@code secure_url} is returned.
     *
     * @throws CloudinaryUploadException with the exact .NET messages
     *         ({@code "Cloudinary upload failed: <reason>"} /
     *         {@code "Cloudinary returned no URL."})
     */
    static String parseUploadResponse(int statusCode, String body) {
        JsonNode root;
        try {
            root = MAPPER.readTree(body);
        } catch (JsonProcessingException ex) {
            throw new CloudinaryUploadException(unreadableResponseMessage(statusCode));
        }
        if (root == null || !root.isObject()) {
            throw new CloudinaryUploadException(unreadableResponseMessage(statusCode));
        }

        JsonNode error = root.get("error");
        if (error != null && error.isObject()) {
            String message = text(error, "message");
            throw new CloudinaryUploadException(
                    "Cloudinary upload failed: " + (isBlank(message) ? "unknown error" : message));
        }

        String secureUrl = text(root, "secure_url");
        if (isBlank(secureUrl)) {
            throw new CloudinaryUploadException("Cloudinary returned no URL.");
        }
        return secureUrl;
    }

    private static String unreadableResponseMessage(int statusCode) {
        return "Cloudinary upload failed: HTTP " + statusCode + " (unreadable response).";
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value != null && value.isTextual() ? value.asText() : null;
    }

    private static String basicAuth(String apiKey, String apiSecret) {
        return "Basic " + Base64.getEncoder()
                .encodeToString((apiKey + ":" + apiSecret).getBytes(StandardCharsets.UTF_8));
    }

    private static String sha1Hex(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-1")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-1 is required by the Java platform.", ex);
        }
    }

    private static void write(ByteArrayOutputStream out, String text) {
        out.writeBytes(text.getBytes(StandardCharsets.UTF_8));
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
