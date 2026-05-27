using Immersio.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace Immersio.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
        {
            var host = _configuration["Email:Smtp:Host"];
            var username = _configuration["Email:Smtp:Username"];
            var password = _configuration["Email:Smtp:Password"];
            var fromEmail = _configuration["Email:Smtp:FromEmail"] ?? username;
            var fromName = _configuration["Email:Smtp:FromName"] ?? "IMMERSIO";

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException(
                    "SMTP email is not configured. Set Email:Smtp:Host, Email:Smtp:Username and Email:Smtp:Password.");

            var port = int.TryParse(_configuration["Email:Smtp:Port"], out var parsedPort) ? parsedPort : 587;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            using var client = new SmtpClient();
            var socketOptions = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

            await client.ConnectAsync(host, port, socketOptions, cancellationToken);
            await client.AuthenticateAsync(username, password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
    }
}
