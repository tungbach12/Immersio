namespace Immersio.Application.DTOs.Auth
{
    public sealed record LoginRequest(string Email, string Password);

    public sealed record RegisterRequest(string Username, string Email, string Password);

    public sealed record RefreshTokenRequest(string AccessToken, string RefreshToken);

    public sealed record RevokeTokenRequest(string RefreshToken);

    public sealed record AuthResponse(string AccessToken, string RefreshToken, UserDto User);

    public sealed record UserDto(Guid Id, string Username, string Email, string SubscriptionTier, DateTime? SubscriptionExpiresAt, int StreakCount, int ExperiencePoints, double LearningHours, string CurrentLanguageLevel, string Role);
}
