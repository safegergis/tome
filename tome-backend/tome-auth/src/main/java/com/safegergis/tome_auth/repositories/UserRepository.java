package com.safegergis.tome_auth.repositories;

import com.safegergis.tome_auth.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by username (case-sensitive)
     * Excludes soft-deleted users (deleted_at IS NULL)
     */
    Optional<User> findByUsernameAndDeletedAtIsNull(String username);

    /**
     * Find user by email (case-sensitive)
     * Excludes soft-deleted users (deleted_at IS NULL)
     */
    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    /**
     * Check if username exists (excluding soft-deleted users)
     */
    boolean existsByUsernameAndDeletedAtIsNull(String username);

    /**
     * Check if email exists (excluding soft-deleted users)
     */
    boolean existsByEmailAndDeletedAtIsNull(String email);

    /**
     * Search users by username (case-insensitive partial match)
     * Excludes soft-deleted users (deleted_at IS NULL)
     *
     * @param searchTerm the search term to match against username
     * @return list of users matching the search criteria
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND u.deletedAt IS NULL")
    List<User> searchByUsername(@Param("searchTerm") String searchTerm);
}
