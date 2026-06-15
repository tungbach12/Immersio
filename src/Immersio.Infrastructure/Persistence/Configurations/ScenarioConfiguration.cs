using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class ScenarioConfiguration : IEntityTypeConfiguration<Scenario>
    {
        public void Configure(EntityTypeBuilder<Scenario> builder)
        {
            builder.ToTable("Scenarios");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.Title)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(s => s.Language)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(s => s.Level)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(s => s.Category)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(s => s.Description)
                .HasMaxLength(1000)
                .IsRequired();

            builder.Property(s => s.Duration)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(s => s.ImageUrl)
                .HasMaxLength(1000)
                .IsRequired();

            builder.Property(s => s.ContextPrompt)
                .HasMaxLength(4000)
                .IsRequired();

            builder.Property(s => s.InitialMessage)
                .HasMaxLength(1000)
                .IsRequired();

            builder.Property(s => s.AvatarUrl)
                .HasMaxLength(1000)
                .IsRequired();

            builder.Property(s => s.VoiceId)
                .HasMaxLength(100)
                .IsRequired(false);

            builder.Property(s => s.EmotionsJson)
                .HasMaxLength(2000)
                .IsRequired(false);

            // Soft delete query filter
            builder.HasQueryFilter(s => !s.IsDeleted);

            // Configure relationship: Scenario 1 - N ScenarioItem
            builder.HasMany(s => s.Items)
                .WithOne(i => i.Scenario)
                .HasForeignKey(i => i.ScenarioId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
