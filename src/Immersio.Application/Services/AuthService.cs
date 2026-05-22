using Immersio.Application.DTOs.Auth;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Immersio.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Immersio.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IApplicationDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IConfiguration _configuration;

        public AuthService(
            IApplicationDbContext context,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IConfiguration configuration)
        {
            _context = context;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
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

            var refreshTokenValue = _tokenService.GenerateRefreshToken();
            var refreshTokenExpiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
            var refreshToken = new RefreshToken(refreshTokenValue, user.Id, DateTime.UtcNow.AddDays(refreshTokenExpiryDays));
            user.AddRefreshToken(refreshToken);

            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);

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

            return MapToDto(user);
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
                user.CurrentLanguageLevel);
        }
    }
}
