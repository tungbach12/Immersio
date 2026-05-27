using Immersio.Application.DTOs.Auth;
using Immersio.Application.DTOs.Common;
using Immersio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Immersio.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _authService.RegisterAsync(request, cancellationToken);
            return Created(string.Empty, ApiResponse<AuthResponse>.SuccessResult(result));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _authService.LoginAsync(request, cancellationToken);
            return Ok(ApiResponse<AuthResponse>.SuccessResult(result));
        }

        [HttpPost("google")]
        public async Task<IActionResult> LoginWithGoogle(
            [FromBody] GoogleLoginRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _authService.LoginWithGoogleAsync(request, cancellationToken);
            return Ok(ApiResponse<AuthResponse>.SuccessResult(result));
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken(
            [FromBody] RefreshTokenRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _authService.RefreshTokenAsync(request, cancellationToken);
            return Ok(ApiResponse<AuthResponse>.SuccessResult(result));
        }

        [HttpPost("revoke")]
        [Authorize]
        public async Task<IActionResult> RevokeToken(
            [FromBody] RevokeTokenRequest request,
            CancellationToken cancellationToken)
        {
            await _authService.RevokeTokenAsync(request, cancellationToken);
            return Ok(ApiResponse.SuccessResult("Token revoked successfully"));
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me(CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var user = await _authService.GetUserByIdAsync(userId, cancellationToken);
            if (user is null)
                return NotFound(ApiResponse.FailureResult("User not found."));

            return Ok(ApiResponse<UserDto>.SuccessResult(user));
        }
    }
}
