package com.immersio.shared.email;

import java.time.ZoneOffset;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;

/**
 * HTML email templates — 1:1 port of src/Immersio.Application/Common/EmailTemplates.cs
 * so users receive byte-similar emails after the switch to the Java backend.
 */
public final class EmailTemplates {

    public record EmailContent(String subject, String htmlBody) {}

    private EmailTemplates() {}

    public static EmailContent welcome(String username) {
        String body = """
                <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Chào mừng đến với IMMERSIO! 🎉</h1>
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">
                    Tài khoản của bạn đã được tạo thành công. Bắt đầu hành trình luyện nói ngoại ngữ cùng AI ngay hôm nay:
                    hội thoại nhập vai, đánh giá phát âm chuẩn âm vị và flashcard ghi nhớ dài hạn.
                </p>
                %s
                <p style="margin:24px 0 0;font-size:13px;color:#64748b;">Chúc bạn học vui và hiệu quả!</p>"""
                .formatted(escape(username), button("Bắt đầu học ngay", "https://immersio.app/student/dashboard"));
        return new EmailContent("Chào mừng bạn đến với IMMERSIO", layout("Chào mừng", body));
    }

    public static EmailContent passwordResetOtp(String otp, int expiryMinutes) {
        String body = """
                <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Đặt lại mật khẩu</h1>
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">
                    Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản IMMERSIO. Nhập mã OTP bên dưới để tiếp tục:
                </p>
                <div style="margin:0 0 16px;text-align:center;">
                    <span style="display:inline-block;font-size:34px;font-weight:800;letter-spacing:10px;color:#4f46e5;background:#eef2ff;border:1px solid #c7d2fe;border-radius:14px;padding:16px 28px;">%s</span>
                </div>
                <p style="margin:0 0 16px;font-size:14px;color:#334155;">Mã có hiệu lực trong <strong>%d phút</strong>.</p>
                <p style="margin:0;font-size:13px;color:#64748b;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.</p>"""
                .formatted(escape(otp), expiryMinutes);
        return new EmailContent("Mã OTP đặt lại mật khẩu IMMERSIO", layout("Đặt lại mật khẩu", body));
    }

    public static EmailContent paymentConfirmation(String username, String tier, String billingCycle,
                                                   LocalDate expiresAt) {
        String cycleLabel = "yearly".equalsIgnoreCase(billingCycle) ? "Hàng năm" : "Hàng tháng";
        String expiresLabel = expiresAt != null
                ? expiresAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Không giới hạn";
        String body = """
                <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Thanh toán thành công ✅</h1>
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">Xin chào <strong>%s</strong>,</p>
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">Cảm ơn bạn đã nâng cấp tài khoản IMMERSIO. Chi tiết gói của bạn:</p>
                <table style="width:100%%;border-collapse:collapse;margin:0 0 16px;font-size:14px;color:#334155;">
                    <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">Gói</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">%s</td></tr>
                    <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">Chu kỳ</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">%s</td></tr>
                    <tr><td style="padding:10px 0;">Hiệu lực đến</td><td style="padding:10px 0;text-align:right;font-weight:700;">%s</td></tr>
                </table>
                %s"""
                .formatted(escape(username), escape(tier), cycleLabel, expiresLabel,
                        button("Khám phá tính năng Premium", "https://immersio.app/student/dashboard"));
        return new EmailContent("Xác nhận nâng cấp gói IMMERSIO", layout("Xác nhận thanh toán", body));
    }

    private static String button(String label, String url) {
        return """
                <div style="margin:0 0 8px;">
                    <a href="%s" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 26px;border-radius:12px;">%s</a>
                </div>""".formatted(url, escape(label));
    }

    private static String layout(String title, String innerHtml) {
        int year = Year.now(ZoneOffset.UTC).getValue();
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title></head>
                <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" style="width:100%%;border-collapse:collapse;background:#f1f5f9;padding:24px 0;">
                        <tr><td align="center">
                            <table role="presentation" style="width:100%%;max-width:560px;border-collapse:collapse;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
                                <tr><td style="background:linear-gradient(135deg,#1e293b,#312e81);padding:28px 32px;">
                                    <span style="font-size:20px;font-weight:800;font-style:italic;letter-spacing:-0.5px;color:#ffffff;">IMMERSIO</span>
                                </td></tr>
                                <tr><td style="padding:32px;">%s</td></tr>
                                <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                                    <p style="margin:0;font-size:11px;color:#94a3b8;">© %d IMMERSIO · Học ngoại ngữ phản xạ bằng AI</p>
                                </td></tr>
                            </table>
                        </td></tr>
                    </table>
                </body>
                </html>""".formatted(escape(title), innerHtml, year);
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
