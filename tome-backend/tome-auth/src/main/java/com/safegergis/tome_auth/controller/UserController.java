package com.safegergis.tome_auth.controller;

import com.safegergis.tome_auth.dto.UserDTO;
import com.safegergis.tome_auth.models.User;
import com.safegergis.tome_auth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * REST Controller for user-related operations
 * Provides public endpoints for service-to-service communication
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;

    /**
     * GET /api/users/{id} - Get user by ID
     * Public endpoint for service-to-service communication
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        log.info("Fetching user with ID: {}", id);

        return userRepository.findById(id)
                .map(this::toUserDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/users/batch - Get multiple users by IDs
     * Public endpoint for batch fetching users
     */
    @PostMapping("/batch")
    public ResponseEntity<List<UserDTO>> getUsersByIds(@RequestBody Set<Long> userIds) {
        log.info("Batch fetching {} users", userIds.size());

        List<UserDTO> users = userRepository.findAllById(userIds)
                .stream()
                .map(this::toUserDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    /**
     * Convert User entity to UserDTO
     */
    private UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
