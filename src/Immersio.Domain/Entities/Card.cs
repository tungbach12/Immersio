using System;

namespace Immersio.Domain.Entities
{
    public class Card
    {
        public Guid Id { get; private set; }
        public Guid DeckId { get; private set; }
        public string Front { get; private set; } = null!;
        public string Back { get; private set; } = null!;
        public string? Explanation { get; private set; }

        // Spaced Repetition System (SRS) parameters - SuperMemo-2
        public int Repetitions { get; private set; }
        public double EasinessFactor { get; private set; }
        public int IntervalDays { get; private set; }
        public DateTime NextReviewDate { get; private set; }
        public DateTime? LastReviewedAt { get; private set; }
        
        public DateTime CreatedAt { get; private set; }
        public bool IsDeleted { get; private set; }

        // Navigation
        public Deck Deck { get; private set; } = null!;

        private Card() { } // EF Core

        public Card(Guid deckId, string front, string back, string? explanation = null)
        {
            if (string.IsNullOrWhiteSpace(front))
                throw new ArgumentException("Front content cannot be empty.", nameof(front));
            if (string.IsNullOrWhiteSpace(back))
                throw new ArgumentException("Back content cannot be empty.", nameof(back));

            Id = Guid.NewGuid();
            DeckId = deckId;
            Front = front;
            Back = back;
            Explanation = explanation;

            // Initial SM-2 parameters
            Repetitions = 0;
            EasinessFactor = 2.5; // Default standard starting value in SM-2
            IntervalDays = 0;
            NextReviewDate = DateTime.UtcNow; // Review immediately
            CreatedAt = DateTime.UtcNow;
            IsDeleted = false;
        }

        /// <summary>
        /// Apply the SuperMemo-2 Spaced Repetition Algorithm to calculate the next review interval.
        /// </summary>
        /// <param name="quality">User response quality from 0 (Total Blackout) to 5 (Perfect Recall)</param>
        public void Review(int quality)
        {
            if (quality < 0 || quality > 5)
                throw new ArgumentOutOfRangeException(nameof(quality), "Quality score must be between 0 and 5.");

            LastReviewedAt = DateTime.UtcNow;

            // 1. Calculate Easiness Factor (EF) adjustment
            // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            double newEf = EasinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            EasinessFactor = Math.Max(1.3, newEf); // The absolute minimum Easiness Factor is 1.3

            // 2. Calculate interval and repetitions based on quality score
            if (quality >= 3) // Successful recall
            {
                if (Repetitions == 0)
                {
                    IntervalDays = 1;
                }
                else if (Repetitions == 1)
                {
                    IntervalDays = 6;
                }
                else
                {
                    IntervalDays = (int)Math.Round(IntervalDays * EasinessFactor);
                }

                Repetitions++;
            }
            else // Failed recall - reset repetitions and schedule for tomorrow (1 day interval)
            {
                Repetitions = 0;
                IntervalDays = 1;
            }

            // 3. Set the absolute next review timestamp
            NextReviewDate = DateTime.UtcNow.AddDays(IntervalDays);
        }

        public void Delete()
        {
            IsDeleted = true;
        }
    }
}
