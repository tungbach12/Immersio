using Immersio.Application.Interfaces;
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
                return Unauthorized();

            var updatedUser = await _authService.UpgradeSubscriptionAsync(
                userId, 
                request.Tier, 
                request.BillingCycle, 
                cancellationToken);

            return Ok(updatedUser);
        }
    }

    public sealed record UpgradeSubscriptionRequest(string Tier, string BillingCycle);
}
