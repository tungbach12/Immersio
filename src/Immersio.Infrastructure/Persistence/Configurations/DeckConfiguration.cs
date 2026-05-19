using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class DeckConfiguration : IEntityTypeConfiguration<Deck>
    {
        public void Configure(EntityTypeBuilder<Deck> builder)
        {
            builder.ToTable("Decks");

            builder.HasKey(d => d.Id);

            builder.Property(d => d.Name)
                .HasMaxLength(150)
                .IsRequired();

            // Set up Global Query Filter for Soft Delete
            builder.HasQueryFilter(d => !d.IsDeleted);

            // Configure relationship with User (1 User - N Decks)
            builder.HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict); // Avoid cascading delete of users to prevent deleting decks implicitly
        }
    }
}
