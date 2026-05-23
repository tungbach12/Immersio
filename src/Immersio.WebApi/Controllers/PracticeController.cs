using Immersio.Application.DTOs.Practice;
using Immersio.Application.DTOs.Common;
using Immersio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PracticeController : ControllerBase
    {
        private readonly IPronunciationService _pronunciationService;

        public PracticeController(IPronunciationService pronunciationService)
        {
            _pronunciationService = pronunciationService;
        }

        [HttpPost("pronunciation-log")]
        public async Task<IActionResult> LogPronunciation(
            [FromBody] CreatePronunciationLogRequest request,
            CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var result = await _pronunciationService.LogPronunciationAsync(userId, request, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResult(result));
        }

        [HttpGet("pronunciation-history")]
        public async Task<IActionResult> GetPronunciationHistory(CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var logs = await _pronunciationService.GetUserLogsAsync(userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResult(logs));
        }

        [HttpGet("cefr-analysis")]
        public async Task<IActionResult> GetCefrAnalysis(CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var analysis = await _pronunciationService.AnalyzeCefrLevelAsync(userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResult(analysis));
        }
    }
}
