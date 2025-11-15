package com.safegergis.tome_auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:8081}")
    private String frontendUrl;

    @Async
    public void sendVerificationEmail(String to, String username, String verificationCode) {
        try {
            String subject = "Verify Your Tome Account";

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("verificationCode", verificationCode);

            String htmlContent = templateEngine.process("email/verification", context);

            sendHtmlEmail(to, subject, htmlContent);
            log.info("Verification email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to: {}", to, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    @Async
    public void sendPasswordResetEmail(String to, String username, String resetToken) {
        try {
            String subject = "Reset Your Tome Password";
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            Context context = new Context();
            context.setVariable("username", username);
            context.setVariable("resetLink", resetLink);

            String htmlContent = templateEngine.process("email/password-reset", context);

            sendHtmlEmail(to, subject, htmlContent);
            log.info("Password reset email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", to, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    @Async
    public void sendWelcomeEmail(String to, String username) {
        try {
            String subject = "Welcome to Tome!";

            Context context = new Context();
            context.setVariable("username", username);

            String htmlContent = templateEngine.process("email/welcome", context);

            sendHtmlEmail(to, subject, htmlContent);
            log.info("Welcome email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", to, e);
            // Don't throw exception for welcome email failure
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }
}
