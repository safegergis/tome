package com.safegergis.tome_auth.repositories;

import com.safegergis.tome_auth.models.VerificationToken;
import com.safegergis.tome_auth.models.VerificationToken.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    /**
     * Find a verification token by user ID, code, and token type
     */
    Optional<VerificationToken> findByUserIdAndCodeAndTokenType(Long userId, String code, TokenType tokenType);

    /**
     * Find the most recent unverified token for a user and token type
     */
    Optional<VerificationToken> findFirstByUserIdAndTokenTypeAndVerifiedAtIsNullOrderByCreatedAtDesc(
            Long userId, TokenType tokenType);

    /**
     * Delete expired tokens (cleanup)
     */
    void deleteByExpiresAtBefore(OffsetDateTime dateTime);

    /**
     * Delete all tokens for a user of a specific type
     */
    void deleteByUserIdAndTokenType(Long userId, TokenType tokenType);
}
