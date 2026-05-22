using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(u => u.Id);

            builder.Property(u => u.Username)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(u => u.Username)
                .IsUnique();

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            builder.HasIndex(u => u.Email)
                .IsUnique();

            builder.Property(u => u.PasswordHash)
                .IsRequired();

            builder.Property(u => u.CreatedAt)
                .IsRequired();

            builder.Property(u => u.SubscriptionTier)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("Basic");

            builder.Property(u => u.SubscriptionExpiresAt);

            builder.Property(u => u.StreakCount)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(u => u.ExperiencePoints)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(u => u.LearningHours)
                .IsRequired()
                .HasDefaultValue(0.0);

            builder.Property(u => u.CurrentLanguageLevel)
                .IsRequired()
                .HasMaxLength(100)
                .HasDefaultValue("Unassigned");

            builder.HasQueryFilter(u => !u.IsDeleted);

            builder.HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // EF Core needs to know about the backing field for the collection
            builder.Navigation(u => u.RefreshTokens)
                .UsePropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}
