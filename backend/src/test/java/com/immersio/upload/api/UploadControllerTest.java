package com.immersio.upload.api;

import com.immersio.shared.dto.ApiResponse;
import com.immersio.upload.service.CloudinaryUploadException;
import com.immersio.upload.service.ImageUploadService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Contract tests for POST /api/upload/image: validation rules (mirroring the .NET
 * UploadController), folder defaulting and the exact status codes / response
 * envelope the frontend consumes ({@code {success, data:{url}}} on success,
 * {@code {success:false, message}} on failure).
 */
class UploadControllerTest {

    private static final String SECURE_URL =
            "https://res.cloudinary.com/demo/image/upload/v1/immersio/scenarios/cat.png";
    private static final int MAX_BYTES = 10 * 1024 * 1024;

    private static final class RecordingUploadService implements ImageUploadService {
        byte[] content;
        String fileName;
        String folder;
        RuntimeException failure;

        @Override
        public String uploadImage(byte[] content, String fileName, String folder) {
            this.content = content;
            this.fileName = fileName;
            this.folder = folder;
            if (failure != null) {
                throw failure;
            }
            return SECURE_URL;
        }
    }

    private static MockMultipartFile pngFile(String name) {
        return new MockMultipartFile("file", name, "image/png", new byte[] {1, 2, 3});
    }

    private static ApiResponse<Map<String, String>> body(ResponseEntity<ApiResponse<Map<String, String>>> response) {
        assertThat(response.getBody()).isNotNull();
        return response.getBody();
    }

    @Test
    void returnsSecureUrlInSuccessEnvelope() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);

        ResponseEntity<ApiResponse<Map<String, String>>> response =
                controller.uploadImage(pngFile("cat.png"), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body(response).isSuccess()).isTrue();
        assertThat(body(response).getData()).isEqualTo(Map.of("url", SECURE_URL));
        assertThat(service.content).isEqualTo(new byte[] {1, 2, 3});
        assertThat(service.fileName).isEqualTo("cat.png");
    }

    @Test
    void defaultsFolderToImmersioScenariosLikeDotNet() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);

        controller.uploadImage(pngFile("cat.png"), null);
        assertThat(service.folder).isEqualTo("immersio/scenarios");

        controller.uploadImage(pngFile("cat.png"), "   ");
        assertThat(service.folder).isEqualTo("immersio/scenarios");
    }

    @Test
    void forwardsCustomFolder() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);

        controller.uploadImage(pngFile("avatar.png"), "immersio/avatars");

        assertThat(service.folder).isEqualTo("immersio/avatars");
        assertThat(service.fileName).isEqualTo("avatar.png");
    }

    @Test
    void rejectsMissingFile() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.uploadImage(null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).isSuccess()).isFalse();
        assertThat(body(response).getMessage()).isEqualTo("No file was uploaded.");
        assertThat(service.content).isNull();
    }

    @Test
    void rejectsEmptyFile() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);
        MockMultipartFile empty = new MockMultipartFile("file", "cat.png", "image/png", new byte[0]);

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.uploadImage(empty, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).getMessage()).isEqualTo("No file was uploaded.");
        assertThat(service.content).isNull();
    }

    @Test
    void rejectsFileAboveTenMegabytes() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);
        MockMultipartFile big = new MockMultipartFile(
                "file", "big.png", "image/png", new byte[MAX_BYTES + 1]);

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.uploadImage(big, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).getMessage()).isEqualTo("File exceeds the 10 MB limit.");
        assertThat(service.content).isNull();
    }

    @Test
    void acceptsFileExactlyAtTenMegabytes() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);
        MockMultipartFile exact = new MockMultipartFile(
                "file", "exact.png", "image/png", new byte[MAX_BYTES]);

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.uploadImage(exact, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body(response).getData()).isEqualTo(Map.of("url", SECURE_URL));
    }

    @Test
    void rejectsUnsupportedContentType() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);
        MockMultipartFile pdf = new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[] {1});

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.uploadImage(pdf, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).getMessage())
                .isEqualTo("Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.");
        assertThat(service.content).isNull();
    }

    @Test
    void rejectsMissingContentType() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);
        MockMultipartFile unknown = new MockMultipartFile("file", "mystery", null, new byte[] {1});

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.uploadImage(unknown, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).getMessage())
                .isEqualTo("Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.");
    }

    @Test
    void checksSizeBeforeContentTypeLikeDotNet() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);
        MockMultipartFile bigPdf = new MockMultipartFile(
                "file", "big.pdf", "application/pdf", new byte[MAX_BYTES + 1]);

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.uploadImage(bigPdf, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).getMessage()).isEqualTo("File exceeds the 10 MB limit.");
    }

    @Test
    void returns500EnvelopeWhenCloudinaryFails() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        service.failure = new CloudinaryUploadException("Cloudinary upload failed: Invalid Signature");
        UploadController controller = new UploadController(service);

        ResponseEntity<ApiResponse<Map<String, String>>> response =
                controller.uploadImage(pngFile("cat.png"), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(body(response).isSuccess()).isFalse();
        assertThat(body(response).getData()).isNull();
        assertThat(body(response).getMessage()).isEqualTo("Cloudinary upload failed: Invalid Signature");
    }

    @Test
    void returns500EnvelopeWhenCloudinaryIsNotConfigured() throws IOException {
        RecordingUploadService service = new RecordingUploadService();
        service.failure = new CloudinaryUploadException(
                "Cloudinary is not configured. Set cloudinary.cloud-name, cloudinary.api-key and "
                        + "cloudinary.api-secret (env: Cloudinary__CloudName, Cloudinary__ApiKey, "
                        + "Cloudinary__ApiSecret).");
        UploadController controller = new UploadController(service);

        ResponseEntity<ApiResponse<Map<String, String>>> response =
                controller.uploadImage(pngFile("cat.png"), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(body(response).getMessage()).contains("Cloudinary is not configured");
    }

    @Test
    void propagatesReadFailuresAsUnhandledIoException() {
        RecordingUploadService service = new RecordingUploadService();
        UploadController controller = new UploadController(service);
        MockMultipartFile failing = new MockMultipartFile(
                "file", "cat.png", "image/png", new byte[] {1}) {
            @Override
            public byte[] getBytes() throws IOException {
                throw new IOException("disk broken");
            }
        };

        assertThatThrownBy(() -> controller.uploadImage(failing, null))
                .isInstanceOf(IOException.class)
                .hasMessage("disk broken");
        assertThat(service.content).isNull();
    }
}
