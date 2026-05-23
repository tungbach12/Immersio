using System;

namespace Immersio.Domain.Entities
{
    public class SystemSetting
    {
        public Guid Id { get; private set; }
        public string Key { get; private set; } = null!;
        public string Value { get; private set; } = null!;
        public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

        private SystemSetting() { }

        public SystemSetting(string key, string value)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentException("Key cannot be empty.", nameof(key));

            Id = Guid.NewGuid();
            Key = key;
            Value = value;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Update(string value)
        {
            Value = value;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
