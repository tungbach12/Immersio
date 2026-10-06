package com.immersio.shared.email;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * SMTP sender with .NET parity semantics: delivery failures must NEVER break
 * the core flow (register / payment / reset request) — they are logged and
 * swallowed, exactly like SmtpEmailService + TrySendEmailAsync in the .NET stack.
 *
 * Config (bound in application.yml from the same env file the .NET stack used):
 *   spring.mail.host/port/username/password  — SMTP connection
 *   email.smtp.from-email / from-name        — From header
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String host;
    private final String username;
    private final String fromEmail;
    private final String fromName;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.username:}") String username,
            @Value("${email.smtp.from-email:}") String fromEmail,
            @Value("${email.smtp.from-name:IMMERSIO}") String fromName) {
        this.mailSender = mailSender;
        this.host = host == null ? "" : host.trim();
        this.username = username == null ? "" : username;
        this.fromEmail = fromEmail == null ? "" : fromEmail.trim();
        this.fromName = fromName;
    }

    /** Fire-and-forget send: logs failures instead of throwing (see .NET TrySendEmailAsync). */
    public void sendSafe(String toEmail, EmailTemplates.EmailContent content) {
        if (content == null || toEmail == null || toEmail.isBlank()) return;
        try {
            if (host.isBlank()) {
                log.warn("[Email] SMTP not configured — skipping '{}'", content.subject());
                return;
            }
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            String sender = fromEmail.isBlank() ? username : fromEmail;
            if (sender == null || sender.isBlank()) {
                log.warn("[Email] No from-address configured — skipping '{}'", content.subject());
                return;
            }
            helper.setFrom(sender, fromName);
            helper.setTo(toEmail);
            helper.setSubject(content.subject());
            helper.setText(content.htmlBody(), true);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("[Email] Failed to send '{}' to {}: {}", content.subject(), toEmail, ex.getMessage());
        }
    }

    public void sendSafe(String toEmail, String subject, String htmlBody) {
        sendSafe(toEmail, new EmailTemplates.EmailContent(subject, htmlBody));
    }
}
