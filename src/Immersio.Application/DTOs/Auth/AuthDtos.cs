namespace Immersio.Application.DTOs.Auth
{
    public sealed record LoginRequest(string Email, string Password);

    public sealed record RegisterRequest(string Username, string Email, string Password);

    public sealed record RefreshTokenRequest(string AccessToken, string RefreshToken);

    public sealed record RevokeTokenRequest(string RefreshToken);

    public sealed record GoogleLoginRequest(string Credential);

    public sealed record ForgotPasswordRequest(string Email);

    public sealed record ResetPasswordRequest(string Email, string Otp, string NewPassword);

    public sealed record AuthResponse(string AccessToken, string RefreshToken, UserDto User);

    public sealed record UserDto(
        Guid Id, 
        string Username, 
        string Email, 
        string SubscriptionTier, 
        DateTime? SubscriptionExpiresAt, 
        int StreakCount, 
        int ExperiencePoints, 
        double LearningHours, 
        string CurrentLanguageLevel, 
        string Role,
        bool NotifEmail,
        bool NotifPush,
        bool NotifStreak,
        bool NotifTips,
        bool IsPublic
    );

    public sealed record UpdateSettingsRequest(
        bool NotifEmail,
        bool NotifPush,
        bool NotifStreak,
        bool NotifTips
    );
}

