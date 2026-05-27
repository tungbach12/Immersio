using Immersio.Application.DTOs.Common;
using Immersio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly IImageUploadService _imageUploadService;

        private const long MaxBytes = 10 * 1024 * 1024; // 10 MB
        private static readonly string[] AllowedContentTypes =
            { "image/jpeg", "image/png", "image/webp", "image/gif" };

        public UploadController(IImageUploadService imageUploadService)
        {
            _imageUploadService = imageUploadService;
        }

        /// <summary>Uploads an image to Cloudinary and returns its secure URL.</summary>
        [HttpPost("image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(
            [FromForm] UploadImageRequest request,
            CancellationToken cancellationToken)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse.FailureResult("No file was uploaded."));

            if (file.Length > MaxBytes)
                return BadRequest(ApiResponse.FailureResult("File exceeds the 10 MB limit."));

            if (!AllowedContentTypes.Contains(file.ContentType))
                return BadRequest(ApiResponse.FailureResult(
                    "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF."));

            try
            {
                await using var stream = file.OpenReadStream();
                var url = await _imageUploadService.UploadImageAsync(
                    stream,
                    file.FileName,
                    string.IsNullOrWhiteSpace(request.Folder) ? "immersio/scenarios" : request.Folder!,
                    cancellationToken);

                return Ok(ApiResponse<object>.SuccessResult(new { url }));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(500, ApiResponse.FailureResult(ex.Message));
            }
        }
    }

    /// <summary>multipart/form-data request for image upload.</summary>
    public class UploadImageRequest
    {
        public Microsoft.AspNetCore.Http.IFormFile File { get; set; } = null!;

        /// <summary>Optional Cloudinary folder (defaults to immersio/scenarios).</summary>
        public string? Folder { get; set; }
    }
}
