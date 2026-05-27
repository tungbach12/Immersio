namespace Immersio.Application.Interfaces
{
    public sealed record PayOsPaymentStatus(string Status, long AmountPaid);

    public interface IPayOsService
    {
        // Creates a PayOS payment link and returns the hosted checkout URL (shows VietQR).
        Task<string> CreatePaymentLinkAsync(long orderCode, int amount, string description, CancellationToken cancellationToken = default);

        // Queries PayOS for the authoritative status of an order (PAID / PENDING / CANCELLED / ...).
        Task<PayOsPaymentStatus> GetPaymentStatusAsync(long orderCode, CancellationToken cancellationToken = default);
    }
}
