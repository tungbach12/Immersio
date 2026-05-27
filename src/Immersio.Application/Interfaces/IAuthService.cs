using Immersio.Application.DTOs.Auth;

namespace Immersio.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
        Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
        Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken cancellationToken = default);
        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
        Task RevokeTokenAsync(RevokeTokenRequest request, CancellationToken cancellationToken = default);
        Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
        Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
        Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<UserDto> UpgradeSubscriptionAsync(Guid userId, string tier, string billingCycle, CancellationToken cancellationToken = default);
    }
}
