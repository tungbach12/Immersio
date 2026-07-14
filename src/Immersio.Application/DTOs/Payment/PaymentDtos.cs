namespace Immersio.Application.DTOs.Payment
{
    public sealed record CreatePaymentRequest(
        string Tier,
        string BillingCycle,
        /// <summary>Override return URL (for mobile deep links). Null = use appsettings default.</summary>
        string? ReturnUrl = null,
        /// <summary>Override cancel URL (for mobile deep links). Null = use appsettings default.</summary>
        string? CancelUrl = null);

    public sealed record CreatePaymentResponse(string PaymentUrl);

    public sealed record PaymentReturnResult(
        bool Success,
        string Message,
        string? Tier,
        string? BillingCycle,
        long Amount);
}
