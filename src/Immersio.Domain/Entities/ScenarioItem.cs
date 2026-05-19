using System;

namespace Immersio.Domain.Entities
{
    public class ScenarioItem
    {
        public Guid Id { get; private set; }
        public Guid ScenarioId { get; private set; }
        public string Name { get; private set; } = null!;
        public decimal Price { get; private set; }
        public string ImageUrl { get; private set; } = null!;
        public string? Icon { get; private set; }

        // Navigation
        public Scenario Scenario { get; private set; } = null!;

        private ScenarioItem() { } // EF Core

        public ScenarioItem(Guid scenarioId, string name, decimal price, string imageUrl, string? icon = null)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Item name cannot be empty.", nameof(name));
            if (price < 0)
                throw new ArgumentException("Price cannot be negative.", nameof(price));

            Id = Guid.NewGuid();
            ScenarioId = scenarioId;
            Name = name;
            Price = price;
            ImageUrl = imageUrl;
            Icon = icon;
        }
    }
}
