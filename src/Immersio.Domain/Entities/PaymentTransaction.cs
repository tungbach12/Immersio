namespace Immersio.Domain.Entities
{
    public class PaymentTransaction
    {
        public Guid Id { get; private set; }

        public string TxnRef { get; private set; } = string.Empty;

        public Guid UserId { get; private set; }

        public string Tier { get; private set; } = string.Empty;

        public string BillingCycle { get; private set; } = string.Empty;

        public long Amount { get; private set; }

        public string Status { get; private set; } = "Pending";

        public string? VnpTransactionNo { get; private set; }

        public string? ResponseCode { get; private set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public DateTime? PaidAt { get; private set; }

        public bool IsPaid => Status == "Paid";

        private PaymentTransaction() { }

        public PaymentTransaction(string txnRef, Guid userId, string tier, string billingCycle, long amount)
        {
            Id = Guid.NewGuid();
            TxnRef = txnRef;
            UserId = userId;
            Tier = tier;
            BillingCycle = billingCycle;
            Amount = amount;
        }

        public void MarkPaid(string? vnpTransactionNo, string? responseCode)
        {
            Status = "Paid";
            VnpTransactionNo = vnpTransactionNo;
            ResponseCode = responseCode;
            PaidAt = DateTime.UtcNow;
        }

        public void MarkFailed(string? responseCode)
        {
            Status = "Failed";
            ResponseCode = responseCode;
        }
    }
}
