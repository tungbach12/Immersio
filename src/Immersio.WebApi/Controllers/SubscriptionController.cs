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
                request.ReturnUrl,
                request.CancelUrl,
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

        /// <summary>
        /// PayOS webhook/IPN receiver. PayOS POSTs the signed payment notification here
        /// regardless of whether the user returns to the returnUrl, so valid payments
        /// no longer get stuck as Pending. Returns 200 to acknowledge (and let PayOS
        /// stop retrying); the service layer verifies the HMAC signature before acting.
        /// </summary>
        [HttpPost("payos-webhook")]
        [AllowAnonymous]
        [ProducesResponseType(200)]
        public async Task<IActionResult> PayOsWebhook(CancellationToken cancellationToken)
        {
            using var reader = new StreamReader(Request.Body);
            var rawBody = await reader.ReadToEndAsync(cancellationToken);

            try
            {
                await _subscriptionService.HandlePayOsWebhookAsync(rawBody, cancellationToken);
            }
            catch (Exception ex) when (ex is InvalidOperationException or System.Text.Json.JsonException)
            {
                // Invalid signature / malformed body: acknowledge without processing.
                return Ok(ApiResponse.FailureResult("Invalid webhook payload."));
            }

            return Ok(ApiResponse.SuccessResult("OK"));
        }
    }

    public sealed record UpgradeSubscriptionRequest(string Tier, string BillingCycle);
}
