package com.safegergis.tome_auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Client for communicating with tome-user-data service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDataServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.user-data.url:http://localhost:8083}")
    private String userDataServiceUrl;

    /**
     * Get friends count for a user from tome-user-data service
     * Requires authentication token to be passed through
     *
     * @param userId the user ID
     * @param token JWT token for authentication
     * @return friends count, or 0 if service is unavailable
     */
    public Long getFriendsCount(Long userId, String token) {
        try {
            String url = userDataServiceUrl + "/api/friendships/count?userId=" + userId;

            // Create headers with authentication token
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(token);
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);

            // Make request
            org.springframework.http.ResponseEntity<Long> response = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    Long.class
            );

            Long count = response.getBody();
            log.debug("Retrieved friends count for user {}: {}", userId, count);
            return count != null ? count : 0L;

        } catch (Exception e) {
            log.error("Failed to fetch friends count for user {} from user-data service: {}",
                    userId, e.getMessage());
            // Return 0 if service is unavailable rather than failing the whole request
            return 0L;
        }
    }
}
