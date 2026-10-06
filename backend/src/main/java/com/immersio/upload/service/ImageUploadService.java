package com.immersio.upload.service;

/**
 * Uploads images to a cloud host (Cloudinary) and returns the secure URL.
 * Java counterpart of the .NET {@code IImageUploadService}.
 */
public interface ImageUploadService {

    /**
     * Uploads an image and returns its secure URL.
     *
     * @param content  raw file bytes
     * @param fileName original file name, used as the upload filename
     * @param folder   Cloudinary folder; {@code null}/blank falls back to the service default
     * @return the asset's secure URL ({@code https://res.cloudinary.com/...})
     * @throws CloudinaryUploadException if Cloudinary is not configured or the upload fails
     */
    String uploadImage(byte[] content, String fileName, String folder);
}
