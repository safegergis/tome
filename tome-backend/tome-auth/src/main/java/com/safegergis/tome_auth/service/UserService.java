package com.safegergis.tome_auth.service;

import com.safegergis.tome_auth.dto.RegisterRequest;
import com.safegergis.tome_auth.dto.RegisterResponse;
import com.safegergis.tome_auth.exception.UserAlreadyExistsException;
import com.safegergis.tome_auth.exception.VerificationException;
import com.safegergis.tome_auth.models.User;
import com.safegergis.tome_auth.models.VerificationToken;
import com.safegergis.tome_auth.repositories.UserRepository;
import com.safegergis.tome_auth.repositories.VerificationTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final int VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public RegisterResponse registerUser(RegisterRequest request) {
        log.info("Attempting to register user: {}", request.getUsername());

        // Check if username already exists
        if (userRepository.existsByUsernameAndDeletedAtIsNull(request.getUsername())) {
            log.warn("Registration failed: Username already exists: {}", request.getUsername());
            throw new UserAlreadyExistsException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmailAndDeletedAtIsNull(request.getEmail())) {
            log.warn("Registration failed: Email already exists: {}", request.getEmail());
            throw new UserAlreadyExistsException("Email already exists");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        user = userRepository.save(user);
        log.info("User created successfully with ID: {}", user.getId());

        // Generate verification code
        String code = generateVerificationCode(user);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), code);

        return new RegisterResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                "Registration successful. Please check your email for the verification code."
        );
    }

    @Transactional
    public void verifyEmail(Long userId, String code) {
        log.info("Attempting to verify email with code for user ID: {}", userId);

        VerificationToken verificationToken = verificationTokenRepository
                .findByUserIdAndCodeAndTokenType(userId, code.toUpperCase(), VerificationToken.TokenType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new VerificationException("Invalid verification code"));

        if (verificationToken.isVerified()) {
            throw new VerificationException("Email already verified");
        }

        if (verificationToken.isExpired()) {
            throw new VerificationException("Verification code has expired");
        }

        // Mark token as verified
        verificationToken.setVerifiedAt(OffsetDateTime.now());
        verificationTokenRepository.save(verificationToken);

        log.info("Email verified successfully for user ID: {}", userId);

        // Send welcome email
        User user = verificationToken.getUser();
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        log.info("Attempting to resend verification email to: {}", email);

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new VerificationException("User not found"));

        // Check if already verified
        VerificationToken existingToken = verificationTokenRepository
                .findFirstByUserIdAndTokenTypeAndVerifiedAtIsNullOrderByCreatedAtDesc(
                        user.getId(), VerificationToken.TokenType.EMAIL_VERIFICATION)
                .orElse(null);

        if (existingToken != null && existingToken.isVerified()) {
            throw new VerificationException("Email already verified");
        }

        // Delete old verification codes for this user
        verificationTokenRepository.deleteByUserIdAndTokenType(
                user.getId(), VerificationToken.TokenType.EMAIL_VERIFICATION);

        // Generate new code
        String code = generateVerificationCode(user);

        // Send email
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), code);

        log.info("Verification email resent to: {}", email);
    }

    private String generateVerificationCode(User user) {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CODE_CHARACTERS.charAt(RANDOM.nextInt(CODE_CHARACTERS.length())));
        }
        String codeString = code.toString();

        VerificationToken token = new VerificationToken();
        token.setCode(codeString);
        token.setUser(user);
        token.setTokenType(VerificationToken.TokenType.EMAIL_VERIFICATION);
        token.setExpiresAt(OffsetDateTime.now().plusHours(VERIFICATION_TOKEN_EXPIRY_HOURS));

        verificationTokenRepository.save(token);

        log.info("Generated verification code for user ID: {}", user.getId());
        return codeString;
    }
}
