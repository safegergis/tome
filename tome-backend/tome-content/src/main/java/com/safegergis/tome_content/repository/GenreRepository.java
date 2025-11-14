package com.safegergis.tome_content.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_content.modal.Genre;

@Repository
public interface GenreRepository extends JpaRepository<Genre, Long> {

    /**
     * Find a genre by exact name match
     */
    Optional<Genre> findByName(String name);

    /**
     * Find a genre by name (case-insensitive)
     */
    Optional<Genre> findByNameIgnoreCase(String name);

    /**
     * Check if a genre exists by name
     */
    boolean existsByName(String name);

    /**
     * Find all genres ordered alphabetically by name
     */
    List<Genre> findAllByOrderByNameAsc();

    /**
     * Find all genres for a specific book
     */
    @Query("SELECT g FROM Genre g JOIN g.books b WHERE b.id = :bookId")
    List<Genre> findByBookId(@Param("bookId") Long bookId);

    /**
     * Search for genres by name pattern (case-insensitive partial match)
     */
    List<Genre> findByNameContainingIgnoreCase(String namePattern);
}
