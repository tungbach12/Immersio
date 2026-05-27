using Immersio.Application.Interfaces;
using Immersio.Application.DTOs.Common;
using Immersio.Application.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Immersio.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly IAuthService _authService;

        public SubscriptionController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("upgrade")]
        public async Task<IActionResult> Upgrade(
            [FromBody] UpgradeSubscriptionRequest request,
            CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var updatedUser = await _authService.UpgradeSubscriptionAsync(
                userId, 
                request.Tier, 
                request.BillingCycle, 
                cancellationToken);

            return Ok(ApiResponse<UserDto>.SuccessResult(updatedUser));
        }
    }

    public sealed record UpgradeSubscriptionRequest(string Tier, string BillingCycle);
}
