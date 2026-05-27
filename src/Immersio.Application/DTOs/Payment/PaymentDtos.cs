namespace Immersio.Application.DTOs.Payment
{
    public sealed record CreatePaymentRequest(string Tier, string BillingCycle);

    public sealed record CreatePaymentResponse(string PaymentUrl);

    public sealed record PaymentReturnResult(
        bool Success,
        string Message,
        string? Tier,
        string? BillingCycle,
        long Amount);
}
