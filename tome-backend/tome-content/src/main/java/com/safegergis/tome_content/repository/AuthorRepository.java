package com.safegergis.tome_content.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_content.modal.Author;

@Repository
public interface AuthorRepository extends JpaRepository<Author, UUID> {

    /**
     * Find an author by exact name match
     */
    Optional<Author> findByName(String name);

    /**
     * Search for authors by name (case-insensitive partial match)
     */
    List<Author> findByNameContainingIgnoreCase(String name);

    /**
     * Find an author by external API identifier and source
     */
    Optional<Author> findByExternalIdAndExternalSource(String externalId, String externalSource);

    /**
     * Check if an author exists by name
     */
    boolean existsByName(String name);

    /**
     * Find all authors for a specific book
     */
    @Query("SELECT a FROM Author a JOIN a.books b WHERE b.id = :bookId")
    List<Author> findByBookId(@Param("bookId") UUID bookId);

    /**
     * Find authors by external source (e.g., 'google_books', 'open_library')
     */
    List<Author> findByExternalSource(String externalSource);
}
