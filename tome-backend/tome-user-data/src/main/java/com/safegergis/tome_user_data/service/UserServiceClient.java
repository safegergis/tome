package com.safegergis.tome_user_data.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.safegergis.tome_user_data.dto.UserSummaryDTO;
import com.safegergis.tome_user_data.exception.ResourceNotFoundException;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Client service for communicating with tome-auth service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${tome.auth.service.url}")
    private String authServiceUrl;

    /**
     * Fetch user details from tome-auth service
     * Results are cached to reduce inter-service calls
     */
    @Cacheable(value = "users", key = "#userId")
    @CircuitBreaker(name = "user-service", fallbackMethod = "getUserFallback")
    public UserSummaryDTO getUser(Long userId) {
        try {
            log.debug("Fetching user {} from tome-auth service", userId);
            String url = authServiceUrl + "/api/users/" + userId;
            UserDTO fullUser = restTemplate.getForObject(url, UserDTO.class);

            if (fullUser == null) {
                throw new ResourceNotFoundException("User", userId);
            }

            return toUserSummary(fullUser);
        } catch (HttpClientErrorException.NotFound e) {
            log.error("User {} not found in tome-auth service", userId);
            throw new ResourceNotFoundException("User", userId);
        } catch (Exception e) {
            log.error("Error fetching user {} from tome-auth service: {}", userId, e.getMessage());
            throw e;
        }
    }

    /**
     * Fetch multiple users at once (batch operation)
     * Useful for enriching paginated results
     */
    public Map<Long, UserSummaryDTO> getUsers(Set<Long> userIds) {
        log.debug("Fetching {} users from tome-auth service", userIds.size());

        Map<Long, UserSummaryDTO> users = new HashMap<>();
        for (Long userId : userIds) {
            try {
                UserSummaryDTO user = getUser(userId);
                users.put(userId, user);
            } catch (Exception e) {
                log.warn("Failed to fetch user {}: {}", userId, e.getMessage());
                // Add fallback user on error
                users.put(userId, getUserFallback(userId, e));
            }
        }

        return users;
    }

    /**
     * Fallback method when tome-auth service is unavailable
     * Returns partial data with just the ID
     */
    private UserSummaryDTO getUserFallback(Long userId, Exception ex) {
        log.warn("Using fallback for user {}: {}", userId, ex.getMessage());
        return UserSummaryDTO.builder()
                .id(userId)
                .username("User information temporarily unavailable")
                .build();
    }

    /**
     * Convert full UserDTO to minimal UserSummaryDTO
     */
    private UserSummaryDTO toUserSummary(UserDTO user) {
        return UserSummaryDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .build();
    }

    /**
     * Inner DTO for receiving User data from tome-auth
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    static class UserDTO {
        private Long id;
        private String username;
        private String email;
        private String avatarUrl;
        private String bio;
    }
}
