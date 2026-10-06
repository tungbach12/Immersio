package com.immersio.upload.service;

/**
 * Raised when Cloudinary is not configured or an upload request fails.
 *
 * <p>Java counterpart of the {@code InvalidOperationException} thrown by the legacy
 * .NET {@code CloudinaryService}. The upload controller maps it to HTTP 500 with
 * the envelope {@code {success:false, message:<exception message>}}, matching the
 * .NET UploadController behaviour.
 */
public class CloudinaryUploadException extends RuntimeException {

    public CloudinaryUploadException(String message) {
        super(message);
    }

    public CloudinaryUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}
