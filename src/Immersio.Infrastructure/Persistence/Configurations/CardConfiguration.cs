using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class CardConfiguration : IEntityTypeConfiguration<Card>
    {
        public void Configure(EntityTypeBuilder<Card> builder)
        {
            builder.ToTable("Cards");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Front)
                .HasMaxLength(1000)
                .IsRequired();

            builder.Property(c => c.Back)
                .HasMaxLength(2000)
                .IsRequired();

            builder.Property(c => c.Explanation)
                .HasMaxLength(4000);

            builder.Property(c => c.Tag)
                .HasMaxLength(100);

            // Spaced Repetition fields configurations
            builder.Property(c => c.Repetitions)
                .IsRequired();

            builder.Property(c => c.EasinessFactor)
                .IsRequired();

            builder.Property(c => c.IntervalDays)
                .IsRequired();

            builder.Property(c => c.NextReviewDate)
                .IsRequired();

            // Set up Global Query Filter for Soft Delete
            builder.HasQueryFilter(c => !c.IsDeleted);

            // Speed up SRS queries by adding an index on NextReviewDate and DeckId
            builder.HasIndex(c => new { c.DeckId, c.NextReviewDate, c.IsDeleted });

            // Configure relationship with Deck (1 Deck - N Cards)
            builder.HasOne(c => c.Deck)
                .WithMany(d => d.Cards)
                .HasForeignKey(c => c.DeckId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
