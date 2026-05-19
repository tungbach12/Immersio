using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class ScenarioSessionConfiguration : IEntityTypeConfiguration<ScenarioSession>
    {
        public void Configure(EntityTypeBuilder<ScenarioSession> builder)
        {
            builder.ToTable("ScenarioSessions");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.Feedback)
                .HasMaxLength(4000);

            // Configure relationship: User 1 - N ScenarioSessions
            builder.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure relationship: Scenario 1 - N ScenarioSessions
            builder.HasOne(s => s.Scenario)
                .WithMany()
                .HasForeignKey(s => s.ScenarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure relationship: ScenarioSession 1 - N SessionMessage
            builder.HasMany(s => s.Messages)
                .WithOne(m => m.Session)
                .HasForeignKey(m => m.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
