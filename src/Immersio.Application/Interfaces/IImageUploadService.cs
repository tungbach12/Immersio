namespace Immersio.Application.Interfaces
{
    /// <summary>Uploads images to a cloud host (Cloudinary) and returns the secure URL.</summary>
    public interface IImageUploadService
    {
        Task<string> UploadImageAsync(
            Stream fileStream,
            string fileName,
            string folder,
            CancellationToken cancellationToken = default);
    }
}
