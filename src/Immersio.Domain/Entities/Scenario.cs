using System;
using System.Collections.Generic;

namespace Immersio.Domain.Entities
{
    public class Scenario
    {
        public Guid Id { get; private set; }
        public string Title { get; private set; } = null!;
        public string Language { get; private set; } = null!;
        public string Level { get; private set; } = null!;
        public string Category { get; private set; } = null!;
        public string Description { get; private set; } = null!;
        public double Rating { get; private set; }
        public string Duration { get; private set; } = null!;
        public string ImageUrl { get; private set; } = null!;
        public string ContextPrompt { get; private set; } = null!;
        public string InitialMessage { get; private set; } = null!;
        public string AvatarUrl { get; private set; } = null!;
        public bool IsNavigation { get; private set; }
        public bool IsDeleted { get; private set; }
        public string? VoiceId { get; private set; }
        public string? EmotionsJson { get; private set; }

        // Navigation
        public ICollection<ScenarioItem> Items { get; private set; } = new List<ScenarioItem>();

        private Scenario() { } // EF Core

        public Scenario(
            string title, 
            string language, 
            string level, 
            string category, 
            string description, 
            double rating, 
            string duration, 
            string imageUrl, 
            string contextPrompt, 
            string initialMessage, 
            string avatarUrl, 
            bool isNavigation,
            string? voiceId = null,
            string? emotionsJson = null)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title cannot be empty.", nameof(title));
            if (string.IsNullOrWhiteSpace(language))
                throw new ArgumentException("Language cannot be empty.", nameof(language));
            if (string.IsNullOrWhiteSpace(contextPrompt))
                throw new ArgumentException("Context prompt cannot be empty.", nameof(contextPrompt));

            Id = Guid.NewGuid();
            Title = title;
            Language = language;
            Level = level;
            Category = category;
            Description = description;
            Rating = rating;
            Duration = duration;
            ImageUrl = imageUrl;
            ContextPrompt = contextPrompt;
            InitialMessage = initialMessage;
            AvatarUrl = avatarUrl;
            IsNavigation = isNavigation;
            IsDeleted = false;
            VoiceId = voiceId;
            EmotionsJson = emotionsJson;
        }

        public void AddItem(string name, decimal price, string imageUrl, string? icon = null)
        {
            Items.Add(new ScenarioItem(Id, name, price, imageUrl, icon));
        }

        public void Update(
            string title, 
            string language, 
            string level, 
            string category, 
            string description, 
            double rating, 
            string duration, 
            string imageUrl, 
            string contextPrompt, 
            string initialMessage, 
            string avatarUrl, 
            bool isNavigation,
            string? voiceId,
            string? emotionsJson)
        {
            Title = title;
            Language = language;
            Level = level;
            Category = category;
            Description = description;
            Rating = rating;
            Duration = duration;
            ImageUrl = imageUrl;
            ContextPrompt = contextPrompt;
            InitialMessage = initialMessage;
            AvatarUrl = avatarUrl;
            IsNavigation = isNavigation;
            VoiceId = voiceId;
            EmotionsJson = emotionsJson;
        }

        public void UpdateEmotions(string? emotionsJson)
        {
            EmotionsJson = emotionsJson;
        }

        public void Delete()
        {
            IsDeleted = true;
        }
    }
}
