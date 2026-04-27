package com.hrcloud.recruitment.service;

import com.hrcloud.recruitment.model.Candidate;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class CandidateEmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.notifications.enabled:false}")
    private boolean notificationEnabled;

    @Value("${mail.notifications.from:no-reply@hrcloud.local}")
    private String fromAddress;

    public CandidateEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendStatusChangeEmail(Candidate candidate) {
        if (!notificationEnabled) {
            return;
        }
        if (candidate.getEmail() == null || candidate.getEmail().isBlank()) {
            log.warn("Skip candidate status email because email is missing. candidateId={}", candidate.getId());
            return;
        }

        String status = candidate.getStatus();
        EmailTemplate template = buildTemplate(candidate, status);
        if (template == null) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(candidate.getEmail());
            helper.setSubject(template.subject());
            helper.setText(template.body(), true);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send candidate status email. candidateId={}, status={}, error={}",
                    candidate.getId(), status, ex.getMessage());
        }
    }

    private EmailTemplate buildTemplate(Candidate candidate, String status) {
        if (status == null) {
            return null;
        }

                String candidateName = nullSafe(candidate.getFullName(), "Ứng viên");
                String department = nullSafe(candidate.getAssignedDepartment(), "Bộ phận phù hợp");
                String role = nullSafe(candidate.getAssignedRole(), nullSafe(candidate.getPosition(), "vị trí đang tuyển"));
                String statusTime = formatDateTime(candidate.getStatusChangedAt());

        return switch (status.toUpperCase()) {
            case "INTERVIEWING" -> new EmailTemplate(
                                        "[HR Cloud] Cập nhật hồ sơ: Mời phỏng vấn",
                                        buildHtmlLayout(
                                                        "#2563eb",
                                                        "Mời phỏng vấn",
                                                        candidateName,
                                                        "Hồ sơ của bạn đã vượt qua vòng sàng lọc ban đầu và được chuyển sang trạng thái phỏng vấn.",
                                                        "Đội ngũ tuyển dụng sẽ liên hệ để xác nhận lịch phỏng vấn trong thời gian sớm nhất.",
                                                        "Trạng thái cập nhật lúc: " + statusTime,
                                                        "Cảm ơn bạn đã quan tâm và đồng hành cùng HR Cloud."
                                        )
            );
            case "HIRED" -> new EmailTemplate(
                                        "[HR Cloud] Chúc mừng bạn đã trúng tuyển",
                                        buildHtmlLayout(
                                                        "#16a34a",
                                                        "Trúng tuyển",
                                                        candidateName,
                                                        "Chúc mừng bạn đã chính thức trúng tuyển vào hệ thống HR Cloud.",
                                                        "Vị trí dự kiến: <strong>" + escapeHtml(role) + "</strong><br/>"
                                                                        + "Bộ phận dự kiến: <strong>" + escapeHtml(department) + "</strong><br/>"
                                                                        + "Bộ phận nhân sự sẽ gửi hướng dẫn onboard chi tiết trong email tiếp theo.",
                                                        "Trạng thái cập nhật lúc: " + statusTime,
                                                        "Chào mừng bạn đến với đội ngũ của chúng tôi."
                                        )
            );
            case "REJECTED" -> new EmailTemplate(
                                        "[HR Cloud] Kết quả ứng tuyển",
                                        buildHtmlLayout(
                                                        "#dc2626",
                                                        "Chưa phù hợp",
                                                        candidateName,
                                                        "Cảm ơn bạn đã dành thời gian ứng tuyển và tham gia quy trình tuyển dụng tại HR Cloud.",
                                                        "Sau khi đánh giá kỹ hồ sơ và mức độ phù hợp, hiện tại chúng tôi chưa thể đồng hành cùng bạn ở vị trí này.",
                                                        "Trạng thái cập nhật lúc: " + statusTime,
                                                        "Chúng tôi sẽ ưu tiên liên hệ lại ngay khi có cơ hội phù hợp hơn trong tương lai."
                                        )
            );
            default -> null;
        };
    }

        private String buildHtmlLayout(String accentColor,
                                                                     String badgeLabel,
                                                                     String candidateName,
                                                                     String intro,
                                                                     String detail,
                                                                     String statusTime,
                                                                     String footerNote) {
                return """
                                <!doctype html>
                                <html lang=\"vi\">
                                <head>
                                    <meta charset=\"UTF-8\" />
                                    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
                                    <title>Thông báo tuyển dụng HR Cloud</title>
                                </head>
                                <body style=\"margin:0;padding:0;background:#eef2ff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;\">
                                    <table role=\"presentation\" width=\"100%%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:24px 12px;\">
                                        <tr>
                                            <td align=\"center\">
                                                <table role=\"presentation\" width=\"100%%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,0.12);\">
                                                    <tr>
                                                        <td style=\"padding:20px 24px;background:%s;color:#ffffff;\">
                                                            <div style=\"font-size:12px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.9;\">HR Cloud Recruitment</div>
                                                            <h1 style=\"margin:8px 0 0 0;font-size:22px;line-height:1.3;\">Thông báo trạng thái hồ sơ</h1>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style=\"padding:24px;\">
                                                            <span style=\"display:inline-block;padding:6px 12px;border-radius:999px;background:%s22;color:%s;font-size:12px;font-weight:700;margin-bottom:16px;\">%s</span>
                                                            <p style=\"margin:0 0 10px 0;font-size:16px;\">Xin chào <strong>%s</strong>,</p>
                                                            <p style=\"margin:0 0 12px 0;font-size:15px;line-height:1.65;color:#374151;\">%s</p>
                                                            <p style=\"margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#374151;\">%s</p>
                                                            <div style=\"padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;font-size:13px;color:#4b5563;\">%s</div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style=\"padding:18px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;\">
                                                            <p style=\"margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#374151;\">%s</p>
                                                            <p style=\"margin:0;font-size:13px;color:#6b7280;\">Trân trọng,<br/><strong>Đội ngũ Tuyển dụng HR Cloud</strong></p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                </html>
                                """.formatted(
                                accentColor,
                                accentColor,
                                accentColor,
                                escapeHtml(badgeLabel),
                                escapeHtml(candidateName),
                                escapeHtml(intro),
                                detail,
                                escapeHtml(statusTime),
                                escapeHtml(footerNote)
                );
        }

    private String nullSafe(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }

        private String escapeHtml(String value) {
                if (value == null) {
                        return "";
                }
                return value
                                .replace("&", "&amp;")
                                .replace("<", "&lt;")
                                .replace(">", "&gt;")
                                .replace("\"", "&quot;")
                                .replace("'", "&#39;");
        }

        private String formatDateTime(LocalDateTime dateTime) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
                return (dateTime != null ? dateTime : LocalDateTime.now()).format(formatter);
        }

    private record EmailTemplate(String subject, String body) {
    }
}
