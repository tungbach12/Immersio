using Immersio.Application.Common;
using Immersio.Application.DTOs.Auth;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Immersio.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Google.Apis.Auth;
using System.Security.Cryptography;

namespace Immersio.Application.Services
{
    public class AuthService : IAuthService
    {
        private const int OtpExpiryMinutes = 10;
        private const int MaxOtpAttempts = 5;

        private readonly IApplicationDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthService(
            IApplicationDbContext context,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _context = context;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
            _emailService = emailService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
        {
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == request.Email, cancellationToken);

            if (emailExists)
                throw new ConflictException($"Email '{request.Email}' is already registered.");

            var usernameExists = await _context.Users
                .AnyAsync(u => u.Username == request.Username, cancellationToken);

            if (usernameExists)
                throw new ConflictException($"Username '{request.Username}' is already taken.");

            var passwordHash = _passwordHasher.Hash(request.Password);
            var user = new User(request.Username, request.Email, passwordHash);

            var isFirstUser = !await _context.Users.AnyAsync(cancellationToken);
            if (isFirstUser)
            {
                user.SetRole("Admin");
            }

            var refreshTokenValue = _tokenService.GenerateRefreshToken();
            var refreshTokenExpiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
            var refreshToken = new RefreshToken(refreshTokenValue, user.Id, DateTime.UtcNow.AddDays(refreshTokenExpiryDays));
            user.AddRefreshToken(refreshToken);

            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);

            var welcome = EmailTemplates.Welcome(user.Username);
            await TrySendEmailAsync(user.Email, welcome, cancellationToken);

            var accessToken = _tokenService.GenerateAccessToken(user);

            return new AuthResponse(accessToken, refreshToken.Token, MapToDto(user));
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

            if (user is null)
                throw new UnauthorizedException("Invalid email or password.");

            if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
                throw new UnauthorizedException("Invalid email or password.");

            var refreshTokenValue = _tokenService.GenerateRefreshToken();
            var refreshTokenExpiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
            var refreshToken = new RefreshToken(refreshTokenValue, user.Id, DateTime.UtcNow.AddDays(refreshTokenExpiryDays));

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync(cancellationToken);

            var accessToken = _tokenService.GenerateAccessToken(user);

            return new AuthResponse(accessToken, refreshToken.Token, MapToDto(user));
        }

        public async Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken cancellationToken = default)
        {
            GoogleJsonWebSignature.Payload payload;
            try
            {
                var clientId = _configuration["Google:ClientId"];
                var settings = new GoogleJsonWebSignature.ValidationSettings();
                if (!string.IsNullOrEmpty(clientId))
                {
                    settings.Audience = new[] { clientId };
                }

                payload = await GoogleJsonWebSignature.ValidateAsync(request.Credential, settings);
            }
            catch (Exception ex)
            {
                throw new UnauthorizedException($"Google token validation failed: {ex.Message}");
            }

            if (payload == null)
                throw new UnauthorizedException("Invalid Google credential.");

            var email = payload.Email;
            var name = payload.Name ?? payload.GivenName ?? "Google User";

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

            if (user is null)
            {
                var usernameBase = email.Split('@')[0];
                var username = usernameBase;
                int counter = 1;
                while (await _context.Users.AnyAsync(u => u.Username == username, cancellationToken))
                {
                    username = $"{usernameBase}{counter++}";
                }

                user = new User(username, email, string.Empty);

                var isFirstUser = !await _context.Users.AnyAsync(cancellationToken);
                if (isFirstUser)
                {
                    user.SetRole("Admin");
                }

                var refreshTokenValue = _tokenService.GenerateRefreshToken();
                var refreshTokenExpiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
                var refreshToken = new RefreshToken(refreshTokenValue, user.Id, DateTime.UtcNow.AddDays(refreshTokenExpiryDays));
                user.AddRefreshToken(refreshToken);

                _context.Users.Add(user);
                await _context.SaveChangesAsync(cancellationToken);
            }
            else
            {
                var refreshTokenValue = _tokenService.GenerateRefreshToken();
                var refreshTokenExpiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
                var refreshToken = new RefreshToken(refreshTokenValue, user.Id, DateTime.UtcNow.AddDays(refreshTokenExpiryDays));

                _context.RefreshTokens.Add(refreshToken);
                await _context.SaveChangesAsync(cancellationToken);

                user.AddRefreshToken(refreshToken);
            }

            var accessToken = _tokenService.GenerateAccessToken(user);
            var activeRefreshToken = user.RefreshTokens.LastOrDefault()?.Token ?? _tokenService.GenerateRefreshToken();

            return new AuthResponse(accessToken, activeRefreshToken, MapToDto(user));
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
        {
            var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
            if (principal is null)
                throw new UnauthorizedException("Invalid access token.");

            var userIdClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedException("Invalid access token.");

            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken && rt.UserId == userId, cancellationToken);

            if (storedToken is null || !storedToken.IsActive)
                throw new UnauthorizedException("Invalid or expired refresh token.");

            // Refresh Token Rotation: revoke old, issue new
            storedToken.Revoke();

            var newRefreshTokenValue = _tokenService.GenerateRefreshToken();
            var refreshTokenExpiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
            var newRefreshToken = new RefreshToken(newRefreshTokenValue, userId, DateTime.UtcNow.AddDays(refreshTokenExpiryDays));

            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync(cancellationToken);

            var user = storedToken.User!;
            var accessToken = _tokenService.GenerateAccessToken(user);

            return new AuthResponse(accessToken, newRefreshToken.Token, MapToDto(user));
        }

        public async Task RevokeTokenAsync(RevokeTokenRequest request, CancellationToken cancellationToken = default)
        {
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken);

            if (storedToken is null)
                throw new NotFoundException(nameof(RefreshToken), request.RefreshToken);

            if (storedToken.IsRevoked)
                return;

            storedToken.Revoke();
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            return user is null ? null : MapToDto(user);
        }

        public async Task<UserDto> UpgradeSubscriptionAsync(Guid userId, string tier, string billingCycle, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
                throw new NotFoundException("User", userId);

            DateTime? expiresAt = null;
            if (string.Equals(billingCycle, "monthly", StringComparison.OrdinalIgnoreCase))
            {
                expiresAt = DateTime.UtcNow.AddDays(30);
            }
            else if (string.Equals(billingCycle, "yearly", StringComparison.OrdinalIgnoreCase))
            {
                expiresAt = DateTime.UtcNow.AddYears(1);
            }

            user.UpdateSubscription(tier, expiresAt);
            await _context.SaveChangesAsync(cancellationToken);

            var receipt = EmailTemplates.PaymentConfirmation(user.Username, tier, billingCycle, expiresAt);
            await TrySendEmailAsync(user.Email, receipt, cancellationToken);

            return MapToDto(user);
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
        {
            var email = request.Email?.Trim() ?? string.Empty;

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

            // Always behave the same regardless of whether the email exists (avoid account enumeration).
            if (user is null)
                return;

            // Invalidate any previously issued, still-active codes for this email.
            var activeCodes = await _context.PasswordResetCodes
                .Where(c => c.Email == email && c.UsedAt == null && c.ExpiresAt > DateTime.UtcNow)
                .ToListAsync(cancellationToken);
            foreach (var code in activeCodes)
                code.MarkUsed();

            var otp = GenerateOtp();
            var resetCode = new PasswordResetCode(
                email,
                _passwordHasher.Hash(otp),
                DateTime.UtcNow.AddMinutes(OtpExpiryMinutes));

            _context.PasswordResetCodes.Add(resetCode);
            await _context.SaveChangesAsync(cancellationToken);

            var content = EmailTemplates.PasswordResetOtp(otp, OtpExpiryMinutes);
            await TrySendEmailAsync(email, content, cancellationToken);
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
        {
            var email = request.Email?.Trim() ?? string.Empty;

            var resetCode = await _context.PasswordResetCodes
                .Where(c => c.Email == email && c.UsedAt == null)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (resetCode is null || resetCode.IsExpired)
                throw new UnauthorizedException("Mã OTP không hợp lệ hoặc đã hết hạn.");

            if (resetCode.AttemptCount >= MaxOtpAttempts)
            {
                resetCode.MarkUsed();
                await _context.SaveChangesAsync(cancellationToken);
                throw new UnauthorizedException("Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.");
            }

            if (!_passwordHasher.Verify(request.Otp ?? string.Empty, resetCode.CodeHash))
            {
                resetCode.RegisterAttempt();
                await _context.SaveChangesAsync(cancellationToken);
                throw new UnauthorizedException("Mã OTP không hợp lệ hoặc đã hết hạn.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

            if (user is null)
                throw new UnauthorizedException("Mã OTP không hợp lệ hoặc đã hết hạn.");

            user.ResetPassword(_passwordHasher.Hash(request.NewPassword));
            resetCode.MarkUsed();

            // Revoke all active refresh tokens so existing sessions are invalidated.
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);
            foreach (var token in activeTokens)
                token.Revoke();

            await _context.SaveChangesAsync(cancellationToken);
        }

        private static string GenerateOtp()
        {
            return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        }

        private async Task TrySendEmailAsync(string toEmail, EmailTemplates.EmailContent content, CancellationToken cancellationToken)
        {
            try
            {
                await _emailService.SendEmailAsync(toEmail, content.Subject, content.HtmlBody, cancellationToken);
            }
            catch (Exception ex)
            {
                // Email delivery should never break the core flow (register / payment / reset request).
                Console.WriteLine($"[Email] Failed to send '{content.Subject}' to {toEmail}: {ex.Message}");
            }
        }

        public async Task<UserDto> UpdateSettingsAsync(Guid userId, UpdateSettingsRequest request, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
                throw new NotFoundException("User", userId);

            user.UpdateNotificationSettings(request.NotifEmail, request.NotifPush, request.NotifStreak, request.NotifTips);
            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(user);
        }

        public async Task<UserDto> UpdateProfilePictureAsync(Guid userId, string url, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
                throw new NotFoundException("User", userId);

            user.UpdateProfilePicture(url);
            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(user);
        }

        public async Task DeleteAccountAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
                throw new NotFoundException("User", userId);

            // ── Xóa cứng toàn bộ dữ liệu người dùng (Google Play User Data policy) ──
            // Phiên đăng nhập
            var refreshTokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId).ToListAsync(cancellationToken);
            _context.RefreshTokens.RemoveRange(refreshTokens);

            // Mã OTP đặt lại mật khẩu (khóa theo email)
            var resetCodes = await _context.PasswordResetCodes
                .Where(c => c.Email == user.Email).ToListAsync(cancellationToken);
            _context.PasswordResetCodes.RemoveRange(resetCodes);

            // Flashcards (Cards xóa theo cascade của Deck)
            var decks = await _context.Decks
                .Where(d => d.UserId == userId).ToListAsync(cancellationToken);
            _context.Decks.RemoveRange(decks);

            // Phiên hội thoại roleplay (SessionMessages xóa theo cascade)
            var sessions = await _context.ScenarioSessions
                .Where(s => s.UserId == userId).ToListAsync(cancellationToken);
            _context.ScenarioSessions.RemoveRange(sessions);

            // Nhật ký luyện phát âm
            var logs = await _context.UserPronunciationLogs
                .Where(l => l.UserId == userId).ToListAsync(cancellationToken);
            _context.UserPronunciationLogs.RemoveRange(logs);

            // PaymentTransactions được giữ lại (nghĩa vụ lưu chứng từ thanh toán,
            // FK Restrict) — hồ sơ User được ẩn danh hóa nên không còn định danh cá nhân.
            user.Anonymize();

            await _context.SaveChangesAsync(cancellationToken);
        }

        private static UserDto MapToDto(User user)
        {
            return new UserDto(
                user.Id,
                user.Username,
                user.Email,
                user.ActiveSubscriptionTier,
                user.SubscriptionExpiresAt,
                user.StreakCount,
                user.ExperiencePoints,
                user.LearningHours,
                user.CurrentLanguageLevel,
                user.Role,
                user.NotifEmail,
                user.NotifPush,
                user.NotifStreak,
                user.NotifTips,
                user.IsPublic,
                user.ProfilePictureUrl);
        }
    }
}
