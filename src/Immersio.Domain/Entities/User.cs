namespace Immersio.Domain.Entities
{
    public class User
    {
        public Guid Id { get; private set; }

        public string Username { get; private set; } = string.Empty;

        public string Email { get; private set; } = string.Empty;

        public string PasswordHash { get; private set; } = string.Empty;

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; private set; }

        public bool IsDeleted { get; private set; }

        public string SubscriptionTier { get; private set; } = "Basic";

        public DateTime? SubscriptionExpiresAt { get; private set; }

        public string Role { get; private set; } = "Student";

        public string ActiveSubscriptionTier => 
            (SubscriptionExpiresAt == null || SubscriptionExpiresAt > DateTime.UtcNow) ? SubscriptionTier : "Basic";

        public int StreakCount { get; private set; } = 0;

        public int ExperiencePoints { get; private set; } = 0;

        public double LearningHours { get; private set; } = 0.0;

        public string CurrentLanguageLevel { get; private set; } = "Unassigned";

        private readonly List<RefreshToken> _refreshTokens = new();
        public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

        private User() { }

        public User(string username, string email, string passwordHash)
        {
            Id = Guid.NewGuid();
            Username = username;
            Email = email;
            PasswordHash = passwordHash;
        }

        public void AddRefreshToken(RefreshToken token)
        {
            _refreshTokens.Add(token);
        }

        public void SoftDelete()
        {
            IsDeleted = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateSubscription(string tier, DateTime? expiresAt)
        {
            SubscriptionTier = tier;
            SubscriptionExpiresAt = expiresAt;
            UpdatedAt = DateTime.UtcNow;
        }

        public void SetRole(string role)
        {
            if (string.IsNullOrWhiteSpace(role)) return;
            Role = role;
            UpdatedAt = DateTime.UtcNow;
        }

        public void ResetPassword(string newPasswordHash)
        {
            if (string.IsNullOrWhiteSpace(newPasswordHash)) return;
            PasswordHash = newPasswordHash;
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddExperience(int exp)
        {
            if (exp < 0) return;
            ExperiencePoints += exp;
            UpdatedAt = DateTime.UtcNow;
        }

        public void IncrementStreak()
        {
            StreakCount++;
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddLearningHours(double hours)
        {
            if (hours < 0) return;
            LearningHours += hours;
            UpdatedAt = DateTime.UtcNow;
        }

        public void SetLanguageLevel(string level)
        {
            if (string.IsNullOrWhiteSpace(level)) return;
            CurrentLanguageLevel = level;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
