package com.staffconnect.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:noreply@staffconnect.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends welcome email to newly created employee with secure activation link.
     * Does NOT expose permanent passwords in plain text.
     * Returns delivery status string for Admin UI feedback.
     */
    public String sendWelcomeEmail(String toEmail, String employeeName, String employeeId, String activationToken) {
        String setupUrl = String.format("%s/index.html?action=setup-password&email=%s&token=%s",
                frontendUrl, toEmail, activationToken);

        String subject = "Welcome to StaffConnect - Activate Your Employee Account (" + employeeId + ")";

        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
                .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
                .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #ffffff; padding: 32px 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .header p { margin: 6px 0 0; color: #bfdbfe; font-size: 14px; }
                .body { padding: 32px 28px; line-height: 1.6; }
                .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
                .badge-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 6px; margin: 20px 0; }
                .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
                .btn:hover { background: #1d4ed8; }
                .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>StaffConnect</h1>
                  <p>Connecting People, Simplifying Workforce Management</p>
                </div>
                <div class="body">
                  <div class="greeting">Welcome to the team, %s!</div>
                  <p>Your employee profile has been created on the <strong>StaffConnect Workforce Management Portal</strong>. Please complete your account onboarding to access your dashboard, connect with teammates, and update your personal details.</p>
                  
                  <div class="badge-box">
                    <p style="margin: 0 0 6px;"><strong>Employee ID:</strong> <span style="font-family: monospace; color: #1e40af;">%s</span></p>
                    <p style="margin: 0;"><strong>Work Email:</strong> %s</p>
                  </div>

                  <p>For your security, passwords are never transmitted in plain text. Please click the button below to verify your email and set your secure password:</p>

                  <div style="text-align: center;">
                    <a href="%s" class="btn">Activate Account & Set Password</a>
                  </div>

                  <p style="font-size: 13px; color: #64748b;">Or copy this secure link into your browser:<br>
                  <a href="%s" style="color: #2563eb; word-break: break-all;">%s</a></p>

                  <p style="margin-top: 24px; font-size: 13px; color: #475569;">
                    This link is cryptographically protected and valid for 24 hours.<br>
                    If you did not expect this message, please notify your HR Administrator.
                  </p>
                </div>
                <div class="footer">
                  &copy; 2026 StaffConnect Enterprise Systems. All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """,
                employeeName, employeeId, toEmail, setupUrl, setupUrl, setupUrl
        );

        if (!mailEnabled) {
            logger.info("=== [MOCK EMAIL SERVICE] Email is in simulated mode (mail.enabled=false) ===");
            logger.info("To: {}", toEmail);
            logger.info("Subject: {}", subject);
            logger.info("Activation URL: {}", setupUrl);
            logger.info("=========================================================================");
            return "SIMULATED: Email queued in mock mode. Setup link logged in server console.";
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            logger.info("Welcome email successfully dispatched to {}", toEmail);
            return "SENT: Welcome email successfully dispatched via Gmail SMTP to " + toEmail;
        } catch (Exception e) {
            logger.warn("Could not dispatch email via SMTP: {}", e.getMessage());
            logger.info("[FALLBACK CREDENTIALS] Activation link: {}", setupUrl);
            return "WARNING: SMTP delivery failed (" + e.getMessage() + "). Activation link logged in server console.";
        }
    }

    /**
     * Sends password reset code / link to user.
     */
    public boolean sendPasswordResetEmail(String toEmail, String employeeName, String resetToken) {
        String resetUrl = String.format("%s/index.html?action=reset-password&email=%s&token=%s",
                frontendUrl, toEmail, resetToken);
        String subject = "StaffConnect - Password Reset Request";

        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
              <div style="max-width: 500px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e3a8a; margin-top: 0;">Password Reset Request</h2>
                <p>Hello %s,</p>
                <p>We received a request to reset your StaffConnect account password. Click the link below to set a new password:</p>
                <p style="text-align: center;"><a href="%s" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset My Password</a></p>
                <p style="font-size: 12px; color: #64748b;">This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.</p>
              </div>
            </body>
            </html>
            """, employeeName != null ? employeeName : "Colleague", resetUrl);

        if (!mailEnabled) {
            logger.info("=== [MOCK EMAIL] Password Reset Email ===");
            logger.info("To: {}", toEmail);
            logger.info("Reset Link: {}", resetUrl);
            logger.info("=========================================");
            return true;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            return true;
        } catch (Exception e) {
            logger.warn("Password reset email sending failed: {}", e.getMessage());
            return false;
        }
    }
}
