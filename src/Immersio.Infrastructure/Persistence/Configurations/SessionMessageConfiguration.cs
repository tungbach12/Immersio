using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class SessionMessageConfiguration : IEntityTypeConfiguration<SessionMessage>
    {
        public void Configure(EntityTypeBuilder<SessionMessage> builder)
        {
            builder.ToTable("SessionMessages");

            builder.HasKey(m => m.Id);

            builder.Property(m => m.SenderRole)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(m => m.Text)
                .HasMaxLength(4000)
                .IsRequired();

            builder.Property(m => m.CorrectionText)
                .HasMaxLength(4000);

            builder.Property(m => m.CorrectionExplanation)
                .HasMaxLength(4000);

            // Adding indexes on SessionId and SentAt to optimize history loading
            builder.HasIndex(m => new { m.SessionId, m.SentAt });
        }
    }
}
