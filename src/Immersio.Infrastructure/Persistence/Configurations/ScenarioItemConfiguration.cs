using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class ScenarioItemConfiguration : IEntityTypeConfiguration<ScenarioItem>
    {
        public void Configure(EntityTypeBuilder<ScenarioItem> builder)
        {
            builder.ToTable("ScenarioItems");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.Name)
                .HasMaxLength(150)
                .IsRequired();

            builder.Property(i => i.Price)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.Property(i => i.ImageUrl)
                .HasMaxLength(1000)
                .IsRequired();

            builder.Property(i => i.Icon)
                .HasMaxLength(50);
        }
    }
}
