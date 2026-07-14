using Immersio.Application.DTOs.Payment;

namespace Immersio.Application.Interfaces
{
    public interface ISubscriptionService
    {
        Task<string> CreatePaymentUrlAsync(Guid userId, string tier, string billingCycle, string? overrideReturnUrl = null, string? overrideCancelUrl = null, CancellationToken cancellationToken = default);

        Task<PaymentReturnResult> HandlePaymentReturnAsync(long orderCode, CancellationToken cancellationToken = default);
    }
}
