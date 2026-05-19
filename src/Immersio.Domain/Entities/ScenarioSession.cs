using System;
using System.Collections.Generic;

namespace Immersio.Domain.Entities
{
    public class ScenarioSession
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }
        public Guid ScenarioId { get; private set; }
        public DateTime StartedAt { get; private set; }
        public DateTime? FinishedAt { get; private set; }
        public string? Feedback { get; private set; }
        public bool IsFinished { get; private set; }

        // Navigation
        public User User { get; private set; } = null!;
        public Scenario Scenario { get; private set; } = null!;
        public ICollection<SessionMessage> Messages { get; private set; } = new List<SessionMessage>();

        private ScenarioSession() { } // EF Core

        public ScenarioSession(Guid userId, Guid scenarioId)
        {
            Id = Guid.NewGuid();
            UserId = userId;
            ScenarioId = scenarioId;
            StartedAt = DateTime.UtcNow;
            IsFinished = false;
        }

        public void AddMessage(string senderRole, string text, string? correctionText = null, string? correctionExplanation = null)
        {
            if (IsFinished)
                throw new InvalidOperationException("Cannot add messages to a completed learning session.");

            Messages.Add(new SessionMessage(Id, senderRole, text, correctionText, correctionExplanation));
        }

        public void Complete(string feedbackText)
        {
            if (IsFinished)
                throw new InvalidOperationException("This learning session is already finished.");

            Feedback = feedbackText;
            FinishedAt = DateTime.UtcNow;
            IsFinished = true;
        }
    }
}
