namespace Immersio.Domain.Entities
{
    public class PasswordResetCode
    {
        public Guid Id { get; private set; }

        public string Email { get; private set; } = string.Empty;

        public string CodeHash { get; private set; } = string.Empty;

        public DateTime ExpiresAt { get; private set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public DateTime? UsedAt { get; private set; }

        public int AttemptCount { get; private set; }

        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

        public bool IsUsed => UsedAt.HasValue;

        public bool IsActive => !IsUsed && !IsExpired;

        private PasswordResetCode() { }

        public PasswordResetCode(string email, string codeHash, DateTime expiresAt)
        {
            Id = Guid.NewGuid();
            Email = email;
            CodeHash = codeHash;
            ExpiresAt = expiresAt;
        }

        public void MarkUsed()
        {
            UsedAt = DateTime.UtcNow;
        }

        public void RegisterAttempt()
        {
            AttemptCount++;
        }
    }
}
