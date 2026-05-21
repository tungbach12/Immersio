using System;

namespace Immersio.Domain.Entities
{
    public class UserPronunciationLog
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }
        public string Phrase { get; private set; } = null!;
        public string Transcript { get; private set; } = null!;
        public int Score { get; private set; }
        public DateTime PracticedAt { get; private set; }

        // Navigation property
        public User User { get; private set; } = null!;

        private UserPronunciationLog() { } // EF Core

        public UserPronunciationLog(Guid userId, string phrase, string transcript, int score)
        {
            if (string.IsNullOrWhiteSpace(phrase))
                throw new ArgumentException("Phrase cannot be empty.", nameof(phrase));

            Id = Guid.NewGuid();
            UserId = userId;
            Phrase = phrase;
            Transcript = transcript ?? string.Empty;
            Score = score;
            PracticedAt = DateTime.UtcNow;
        }
    }
}
