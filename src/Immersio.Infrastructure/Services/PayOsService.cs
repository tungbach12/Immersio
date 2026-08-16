using System.Globalization;
using System.Linq;
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

        public async Task<string> CreatePaymentLinkAsync(long orderCode, int amount, string description, string? overrideReturnUrl = null, string? overrideCancelUrl = null, CancellationToken cancellationToken = default)
        {
            var (clientId, apiKey, checksumKey) = GetCredentials();
            var returnUrl = overrideReturnUrl ?? _configuration["PayOS:ReturnUrl"];
            var cancelUrl = overrideCancelUrl ?? _configuration["PayOS:CancelUrl"] ?? returnUrl;

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

        /// <summary>
        /// Verifies a PayOS webhook/IPN payload and returns the inner webhook data
        /// object when the HMAC signature matches. PayOS sends:
        ///   { "code": "00", "desc": "...", "success": true, "data": {...}, "signature": "..." }
        /// The signature is HMAC-SHA256(checksumKey, sorted-data-query-string) where
        /// data keys are sorted alphabetically and serialized as key=value&...
        /// </summary>
        public async Task<PayOsWebhookData> VerifyWebhookAsync(string rawBody, CancellationToken cancellationToken = default)
        {
            using var doc = JsonDocument.Parse(rawBody);
            var root = doc.RootElement;

            if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object)
                throw new InvalidOperationException("PayOS webhook missing data.");
            if (!root.TryGetProperty("signature", out var sigEl) || string.IsNullOrWhiteSpace(sigEl.GetString()))
                throw new InvalidOperationException("PayOS webhook missing signature.");

            var checksumKey = GetCredentials().checksumKey;
            var expected = SignObject(data, checksumKey);

            if (!string.Equals(expected, sigEl.GetString(), StringComparison.Ordinal))
                throw new InvalidOperationException("PayOS webhook signature mismatch.");

            var orderCode = data.TryGetProperty("orderCode", out var ocEl) && ocEl.TryGetInt64(out var oc) ? oc : 0;
            // PayOS webhook data uses the transaction "code" field ("00" = success),
            // NOT a "status" field.
            var code = data.TryGetProperty("code", out var cdEl) ? cdEl.GetString() ?? string.Empty : string.Empty;
            var amount = data.TryGetProperty("amount", out var amEl) && amEl.TryGetInt64(out var am) ? am : 0;
            var desc = data.TryGetProperty("description", out var deEl) ? deEl.GetString() ?? string.Empty : string.Empty;

            await Task.CompletedTask;
            return new PayOsWebhookData(orderCode, code, amount, desc);
        }

        internal static string SignObject(JsonElement data, string key)
        {
            var pairs = new List<string>();
            var names = data.EnumerateObject().Select(p => p.Name).OrderBy(n => n, StringComparer.Ordinal).ToList();
            foreach (var name in names)
            {
                var value = data.GetProperty(name);
                pairs.Add($"{name}={SerializeValue(value)}");
            }
            var query = string.Join('&', pairs);
            return HmacSha256(key, query);
        }

        private static string SerializeValue(JsonElement value)
        {
            switch (value.ValueKind)
            {
                case JsonValueKind.Null:
                    return string.Empty;
                case JsonValueKind.String:
                    return value.GetString() ?? string.Empty;
                case JsonValueKind.True:
                    return "true";
                case JsonValueKind.False:
                    return "false";
                case JsonValueKind.Number:
                    return value.GetRawText();
                default:
                    // Arrays/objects serialize to raw JSON (PayOS uses flat scalars in practice).
                    return value.GetRawText();
            }
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
