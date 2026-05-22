using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class UserPronunciationLogConfiguration : IEntityTypeConfiguration<UserPronunciationLog>
    {
        public void Configure(EntityTypeBuilder<UserPronunciationLog> builder)
        {
            builder.ToTable("UserPronunciationLogs");

            builder.HasKey(upl => upl.Id);

            builder.Property(upl => upl.Phrase)
                .IsRequired()
                .HasMaxLength(2000);

            builder.Property(upl => upl.Transcript)
                .IsRequired()
                .HasMaxLength(2000);

            builder.Property(upl => upl.Score)
                .IsRequired();

            builder.Property(upl => upl.PracticedAt)
                .IsRequired();

            builder.HasOne(upl => upl.User)
                .WithMany()
                .HasForeignKey(upl => upl.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
