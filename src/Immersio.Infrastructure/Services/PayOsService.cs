using System.Globalization;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Immersio.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Immersio.Infrastructure.Services
{
    public class PayOsService : IPayOsService
    {
        private const string BaseUrl = "https://api-merchant.payos.vn";
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public PayOsService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> CreatePaymentLinkAsync(long orderCode, int amount, string description, CancellationToken cancellationToken = default)
        {
            var (clientId, apiKey, checksumKey) = GetCredentials();
            var returnUrl = _configuration["PayOS:ReturnUrl"];
            var cancelUrl = _configuration["PayOS:CancelUrl"] ?? returnUrl;

            if (string.IsNullOrWhiteSpace(returnUrl))
                throw new InvalidOperationException("PayOS is not configured. Set PayOS:ReturnUrl.");

            // Signature data must be the fields in alphabetical order.
            var signatureData =
                $"amount={amount}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}";
            var signature = HmacSha256(checksumKey, signatureData);

            var body = new
            {
                orderCode,
                amount,
                description,
                cancelUrl,
                returnUrl,
                signature
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}/v2/payment-requests")
            {
                Content = JsonContent.Create(body)
            };
            request.Headers.Add("x-client-id", clientId);
            request.Headers.Add("x-api-key", apiKey);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var json = await response.Content.ReadAsStringAsync(cancellationToken);

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var code = root.TryGetProperty("code", out var codeEl) ? codeEl.GetString() : null;

            if (code != "00" || !root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object)
            {
                var desc = root.TryGetProperty("desc", out var descEl) ? descEl.GetString() : "Unknown error";
                throw new InvalidOperationException($"PayOS create payment link failed: {desc}");
            }

            var checkoutUrl = data.TryGetProperty("checkoutUrl", out var urlEl) ? urlEl.GetString() : null;
            if (string.IsNullOrEmpty(checkoutUrl))
                throw new InvalidOperationException("PayOS did not return a checkout URL.");

            return checkoutUrl;
        }

        public async Task<PayOsPaymentStatus> GetPaymentStatusAsync(long orderCode, CancellationToken cancellationToken = default)
        {
            var (clientId, apiKey, _) = GetCredentials();

            using var request = new HttpRequestMessage(HttpMethod.Get, $"{BaseUrl}/v2/payment-requests/{orderCode}");
            request.Headers.Add("x-client-id", clientId);
            request.Headers.Add("x-api-key", apiKey);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var json = await response.Content.ReadAsStringAsync(cancellationToken);

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object)
                return new PayOsPaymentStatus("UNKNOWN", 0);

            var status = data.TryGetProperty("status", out var statusEl) ? statusEl.GetString() ?? "UNKNOWN" : "UNKNOWN";
            var amountPaid = data.TryGetProperty("amountPaid", out var paidEl) && paidEl.TryGetInt64(out var paid) ? paid : 0;

            return new PayOsPaymentStatus(status, amountPaid);
        }

        private (string clientId, string apiKey, string checksumKey) GetCredentials()
        {
            var clientId = _configuration["PayOS:ClientId"];
            var apiKey = _configuration["PayOS:ApiKey"];
            var checksumKey = _configuration["PayOS:ChecksumKey"];

            if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(checksumKey))
                throw new InvalidOperationException(
                    "PayOS is not configured. Set PayOS:ClientId, PayOS:ApiKey and PayOS:ChecksumKey.");

            return (clientId, apiKey, checksumKey);
        }

        private static string HmacSha256(string key, string input)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
            var sb = new StringBuilder(hash.Length * 2);
            foreach (var b in hash)
                sb.Append(b.ToString("x2", CultureInfo.InvariantCulture));
            return sb.ToString();
        }
    }
}
