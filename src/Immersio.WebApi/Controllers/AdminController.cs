using Immersio.Application.DTOs.Admin;
using Immersio.Application.DTOs.Auth;
using Immersio.Application.DTOs.Common;
using Immersio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.WebApi.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
        {
            var stats = await _adminService.GetDashboardStatsAsync(cancellationToken);
            return Ok(ApiResponse<AdminDashboardStatsDto>.SuccessResult(stats));
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
        {
            var users = await _adminService.GetUsersAsync(cancellationToken);
            return Ok(ApiResponse<IEnumerable<UserDto>>.SuccessResult(users));
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions(CancellationToken cancellationToken)
        {
            var transactions = await _adminService.GetTransactionsAsync(cancellationToken);
            return Ok(ApiResponse<IEnumerable<PaymentTransactionDto>>.SuccessResult(transactions));
        }

        [HttpPost("transactions/{id:guid}/approve")]
        public async Task<IActionResult> ApproveTransaction(Guid id, CancellationToken cancellationToken)
        {
            var transaction = await _adminService.ApproveTransactionAsync(id, cancellationToken);
            return Ok(ApiResponse<PaymentTransactionDto>.SuccessResult(transaction, "Xác nhận thanh toán thành công."));
        }

        [HttpPost("users/{userId:guid}/subscription")]
        public async Task<IActionResult> UpdateUserSubscription(
            Guid userId,
            [FromBody] UpdateSubscriptionTierRequest request,
            CancellationToken cancellationToken)
        {
            var updatedUser = await _adminService.UpdateUserSubscriptionAsync(userId, request.Tier, request.BillingCycle, cancellationToken);
            return Ok(ApiResponse<UserDto>.SuccessResult(updatedUser));
        }

        [HttpPost("users/{userId:guid}/ban")]
        public async Task<IActionResult> BanUser(Guid userId, CancellationToken cancellationToken)
        {
            var result = await _adminService.BanUserAsync(userId, cancellationToken);
            if (!result)
                return NotFound(ApiResponse.FailureResult("User not found."));

            return Ok(ApiResponse.SuccessResult("User banned successfully."));
        }

        [HttpGet("ai-tuning")]
        public async Task<IActionResult> GetAiSettings(CancellationToken cancellationToken)
        {
            var settings = await _adminService.GetAiSettingsAsync(cancellationToken);
            return Ok(ApiResponse<SystemSettingsDto>.SuccessResult(settings));
        }

        [HttpPost("ai-tuning")]
        public async Task<IActionResult> SaveAiSettings(
            [FromBody] SystemSettingsDto request,
            CancellationToken cancellationToken)
        {
            await _adminService.SaveAiSettingsAsync(request, cancellationToken);
            return Ok(ApiResponse.SuccessResult("AI Settings updated successfully."));
        }
    }

    public sealed record UpdateSubscriptionTierRequest(string Tier, string BillingCycle);
}
