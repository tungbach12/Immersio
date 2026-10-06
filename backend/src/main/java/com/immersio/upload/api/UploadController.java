package com.immersio.upload.api;

import com.immersio.shared.dto.ApiResponse;
import com.immersio.upload.service.CloudinaryUploadException;
import com.immersio.upload.service.ImageUploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * POST /api/upload/image — uploads an image to Cloudinary and returns its secure URL.
 *
 * <p>Port of the .NET {@code Immersio.WebApi UploadController}: same validation
 * rules (10 MB cap, JPEG/PNG/WebP/GIF only), same folder default
 * ({@code immersio/scenarios}), same status codes and the same response envelope
 * the frontend unwraps ({@code {success, data:{url}, ...}} on success,
 * {@code {success:false, message}} with 400/500 on failure). Authentication is
 * enforced by the shared security chain (JWT), mirroring the .NET {@code [Authorize]}.
 */
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    static final long MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    static final String DEFAULT_FOLDER = "immersio/scenarios";

    private final ImageUploadService imageUploadService;

    public UploadController(ImageUploadService imageUploadService) {
        this.imageUploadService = imageUploadService;
    }

    /** Uploads an image to Cloudinary and returns its secure URL. */
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder) throws IOException {

        if (file == null || file.isEmpty()) {
            return badRequest("No file was uploaded.");
        }
        if (file.getSize() > MAX_BYTES) {
            return badRequest("File exceeds the 10 MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return badRequest("Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.");
        }

        String effectiveFolder = folder == null || folder.isBlank() ? DEFAULT_FOLDER : folder;
        try {
            String url = imageUploadService.uploadImage(
                    file.getBytes(), file.getOriginalFilename(), effectiveFolder);
            return ResponseEntity.ok(ApiResponse.successResult(Map.of("url", url)));
        } catch (CloudinaryUploadException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failureResult(ex.getMessage()));
        }
    }

    private static ResponseEntity<ApiResponse<Map<String, String>>> badRequest(String message) {
        return ResponseEntity.badRequest().body(ApiResponse.failureResult(message));
    }
}
