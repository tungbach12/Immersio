namespace Immersio.Application.Interfaces
{
    public sealed record PayOsPaymentStatus(string Status, long AmountPaid);

    public sealed record PayOsWebhookData(long OrderCode, string Status, long Amount, string Description);

    public interface IPayOsService
    {
        // Creates a PayOS payment link and returns the hosted checkout URL (shows VietQR).
        // overrideReturnUrl / overrideCancelUrl: if provided, used instead of appsettings values (used by mobile deep links).
        Task<string> CreatePaymentLinkAsync(long orderCode, int amount, string description, string? overrideReturnUrl = null, string? overrideCancelUrl = null, CancellationToken cancellationToken = default);

        // Queries PayOS for the authoritative status of an order (PAID / PENDING / CANCELLED / ...).
        Task<PayOsPaymentStatus> GetPaymentStatusAsync(long orderCode, CancellationToken cancellationToken = default);

        // Verifies a PayOS webhook/IPN payload signature and returns the parsed webhook data.
        // Throws when the signature is invalid or the payload is malformed.
        Task<PayOsWebhookData> VerifyWebhookAsync(string rawBody, CancellationToken cancellationToken = default);
    }
}
