using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Immersio.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Immersio.Infrastructure.Services
{
    /// <summary>
    /// Uploads images to Cloudinary. Reads credentials from configuration
    /// (Cloudinary:CloudName / Cloudinary:ApiKey / Cloudinary:ApiSecret),
    /// which in production come from the .env file via env vars
    /// (Cloudinary__CloudName, etc.).
    /// </summary>
    public class CloudinaryService : IImageUploadService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration configuration)
        {
            var cloudName = configuration["Cloudinary:CloudName"];
            var apiKey = configuration["Cloudinary:ApiKey"];
            var apiSecret = configuration["Cloudinary:ApiSecret"];

            if (string.IsNullOrWhiteSpace(cloudName) ||
                string.IsNullOrWhiteSpace(apiKey) ||
                string.IsNullOrWhiteSpace(apiSecret))
            {
                throw new InvalidOperationException(
                    "Cloudinary is not configured. Set Cloudinary:CloudName, " +
                    "Cloudinary:ApiKey and Cloudinary:ApiSecret (env: Cloudinary__*).");
            }

            _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret))
            {
                Api = { Secure = true },
            };
        }

        public async Task<string> UploadImageAsync(
            Stream fileStream,
            string fileName,
            string folder,
            CancellationToken cancellationToken = default)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = string.IsNullOrWhiteSpace(folder) ? "immersio" : folder,
                // Cap very large uploads; let Cloudinary auto-pick best format/quality on delivery.
                Transformation = new Transformation().Quality("auto").FetchFormat("auto"),
            };

            var result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);

            if (result.Error != null)
            {
                throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
            }

            return result.SecureUrl?.ToString()
                   ?? throw new InvalidOperationException("Cloudinary returned no URL.");
        }
    }
}
