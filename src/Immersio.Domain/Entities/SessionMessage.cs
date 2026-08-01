using System;

namespace Immersio.Domain.Entities
{
    public class SessionMessage
    {
        public Guid Id { get; private set; }
        public Guid SessionId { get; private set; }
        public string SenderRole { get; private set; } = null!; // "user" or "model"
        public string Text { get; private set; } = null!;
        public DateTime SentAt { get; private set; }

        // Evaluation & Correction fields (if user made grammar/spelling errors)
        public string? CorrectionText { get; private set; }
        public string? CorrectionExplanation { get; private set; }

        // Navigation
        public ScenarioSession Session { get; private set; } = null!;

        private SessionMessage() { } // EF Core

        public SessionMessage(Guid sessionId, string senderRole, string text, string? correctionText = null, string? correctionExplanation = null)
        {
            if (string.IsNullOrWhiteSpace(senderRole))
                throw new ArgumentException("Sender role cannot be empty.", nameof(senderRole));
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Text content cannot be empty.", nameof(text));

            Id = Guid.NewGuid();
            SessionId = sessionId;
            SenderRole = senderRole;
            Text = text;
            SentAt = DateTime.UtcNow;
            CorrectionText = correctionText;
            CorrectionExplanation = correctionExplanation;
        }

        public void SetCorrection(string? correctionText, string? correctionExplanation)
        {
            CorrectionText = correctionText;
            CorrectionExplanation = correctionExplanation;
        }
    }
}
