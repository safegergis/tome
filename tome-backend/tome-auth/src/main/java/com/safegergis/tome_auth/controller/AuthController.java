package com.safegergis.tome_auth.controller;

import com.safegergis.tome_auth.dto.LoginRequest;
import com.safegergis.tome_auth.dto.LoginResponse;
import com.safegergis.tome_auth.dto.RegisterRequest;
import com.safegergis.tome_auth.dto.RegisterResponse;
import com.safegergis.tome_auth.dto.VerifyEmailRequest;
import com.safegergis.tome_auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request received for username: {}", request.getUsername());
        RegisterResponse response = userService.registerUser(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        log.info("Email verification request received for user ID: {}", request.getUserId());
        userService.verifyEmail(request.getUserId(), request.getCode());
        return ResponseEntity.ok(Map.of(
                "message", "Email verified successfully"
        ));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        log.info("Resend verification request received for email: {}", email);
        userService.resendVerificationEmail(email);
        return ResponseEntity.ok(Map.of(
                "message", "Verification email sent successfully"
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for email: {}", request.getEmail());
        LoginResponse response = userService.loginUser(request);
        return ResponseEntity.ok(response);
    }
}
