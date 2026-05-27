using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Immersio.Infrastructure.Persistence.Configurations
{
    public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
    {
        public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
        {
            builder.ToTable("PaymentTransactions");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.TxnRef)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(x => x.TxnRef)
                .IsUnique();

            builder.Property(x => x.UserId)
                .IsRequired();

            builder.HasIndex(x => x.UserId);

            builder.Property(x => x.Tier)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.BillingCycle)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(x => x.Amount)
                .IsRequired();

            builder.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Pending");

            builder.Property(x => x.VnpTransactionNo)
                .HasMaxLength(100);

            builder.Property(x => x.ResponseCode)
                .HasMaxLength(10);

            builder.Property(x => x.CreatedAt)
                .IsRequired();
        }
    }
}
