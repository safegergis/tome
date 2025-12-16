package com.safegergis.tome_auth.controller;

import com.safegergis.tome_auth.dto.LoginRequest;
import com.safegergis.tome_auth.dto.LoginResponse;
import com.safegergis.tome_auth.dto.RegisterRequest;
import com.safegergis.tome_auth.dto.RegisterResponse;
import com.safegergis.tome_auth.dto.UserDTO;
import com.safegergis.tome_auth.dto.UserProfileDTO;
import com.safegergis.tome_auth.dto.VerifyEmailRequest;
import com.safegergis.tome_auth.service.UserService;
import com.safegergis.tome_auth.service.UserDataServiceClient;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final UserDataServiceClient userDataServiceClient;

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

    /**
     * GET /api/auth/users/search?q={query} - Search users by username
     */
    @GetMapping("/users/search")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam String q) {
        log.info("User search request received with query: {}", q);
        List<UserDTO> users = userService.searchUsers(q);
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/auth/users/{id} - Get user profile with friends count
     * Requires authentication (Bearer token)
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserProfileDTO> getUserProfile(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        log.info("User profile request received for user ID: {}", id);

        // Extract token from Authorization header (Bearer <token>)
        String token = authHeader.substring(7); // Remove "Bearer " prefix

        UserProfileDTO profile = userService.getUserProfile(id, token, userDataServiceClient);
        return ResponseEntity.ok(profile);
    }
}
