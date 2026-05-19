namespace Immersio.Domain.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; private set; }

        public string Token { get; private set; } = string.Empty;

        public DateTime ExpiresAt { get; private set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public DateTime? RevokedAt { get; private set; }

        public Guid UserId { get; private set; }

        public User? User { get; private set; }

        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

        public bool IsRevoked => RevokedAt.HasValue;

        public bool IsActive => !IsRevoked && !IsExpired;

        private RefreshToken() { }

        public RefreshToken(string token, Guid userId, DateTime expiresAt)
        {
            Id = Guid.NewGuid();
            Token = token;
            UserId = userId;
            ExpiresAt = expiresAt;
        }

        public void Revoke()
        {
            RevokedAt = DateTime.UtcNow;
        }
    }
}
