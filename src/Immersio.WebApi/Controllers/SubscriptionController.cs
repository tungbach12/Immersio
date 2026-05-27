using Immersio.Application.Interfaces;
using Immersio.Application.DTOs.Common;
using Immersio.Application.DTOs.Auth;
using Immersio.Application.DTOs.Payment;
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
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionController(IAuthService authService, ISubscriptionService subscriptionService)
        {
            _authService = authService;
            _subscriptionService = subscriptionService;
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

        [HttpPost("create-payment")]
        public async Task<IActionResult> CreatePayment(
            [FromBody] CreatePaymentRequest request,
            CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var paymentUrl = await _subscriptionService.CreatePaymentUrlAsync(
                userId,
                request.Tier,
                request.BillingCycle,
                cancellationToken);

            return Ok(ApiResponse<CreatePaymentResponse>.SuccessResult(new CreatePaymentResponse(paymentUrl)));
        }

        [HttpGet("payos-return")]
        [AllowAnonymous]
        public async Task<IActionResult> PayOsReturn([FromQuery] long orderCode, CancellationToken cancellationToken)
        {
            var result = await _subscriptionService.HandlePaymentReturnAsync(orderCode, cancellationToken);

            if (!result.Success)
                return BadRequest(ApiResponse<PaymentReturnResult>.FailureResult(result.Message));

            return Ok(ApiResponse<PaymentReturnResult>.SuccessResult(result));
        }
    }

    public sealed record UpgradeSubscriptionRequest(string Tier, string BillingCycle);
}
