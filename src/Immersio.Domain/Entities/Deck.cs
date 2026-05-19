using System;
using System.Collections.Generic;

namespace Immersio.Domain.Entities
{
    public class Deck
    {
        public Guid Id { get; private set; }
        public string Name { get; private set; } = null!;
        public Guid UserId { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public bool IsDeleted { get; private set; }

        // Navigation properties
        public User User { get; private set; } = null!;
        public ICollection<Card> Cards { get; private set; } = new List<Card>();

        private Deck() { } // EF Core

        public Deck(string name, Guid userId)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Deck name cannot be empty.", nameof(name));

            Id = Guid.NewGuid();
            Name = name;
            UserId = userId;
            CreatedAt = DateTime.UtcNow;
            IsDeleted = false;
        }

        public void Rename(string newName)
        {
            if (string.IsNullOrWhiteSpace(newName))
                throw new ArgumentException("Deck name cannot be empty.", nameof(newName));

            Name = newName;
        }

        public void Delete()
        {
            IsDeleted = true;
        }
    }
}
