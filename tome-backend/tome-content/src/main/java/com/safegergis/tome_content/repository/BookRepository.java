package com.safegergis.tome_content.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_content.modal.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    /**
     * Find a book by ISBN-10
     */
    Optional<Book> findByIsbn10(String isbn10);

    /**
     * Find a book by ISBN-13
     */
    Optional<Book> findByIsbn13(String isbn13);

    /**
     * Search for books by title (case-insensitive partial match)
     */
    List<Book> findByTitleContainingIgnoreCase(String title);

    /**
     * Find a book by external API identifier and source
     */
    Optional<Book> findByExternalIdAndExternalSource(String externalId, String externalSource);

    /**
     * Check if a book exists by either ISBN-10 or ISBN-13
     */
    boolean existsByIsbn10OrIsbn13(String isbn10, String isbn13);

    /**
     * Find all books by a specific author
     */
    @Query("SELECT b FROM Book b JOIN b.authors a WHERE a.id = :authorId")
    List<Book> findByAuthorId(@Param("authorId") Long authorId);

    /**
     * Find all books in a specific genre
     */
    @Query("SELECT b FROM Book b JOIN b.genres g WHERE g.id = :genreId")
    List<Book> findByGenreId(@Param("genreId") Long genreId);

    /**
     * Search books by title using LIKE operator
     */
    @Query("SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Book> searchByTitle(@Param("searchTerm") String searchTerm);

    /**
     * Find books by publisher
     */
    List<Book> findByPublisher(String publisher);

    /**
     * Find books by language
     */
    List<Book> findByLanguage(String language);

    /**
     * Search books by title or author name using PostgreSQL full-text search (non-paginated, limited to 50 results)
     * Uses GIN indexes for improved performance
     *
     * @param searchTerm the search term to match against book title or author name
     * @return list of up to 50 books matching the search criteria, ordered by id for consistency
     */
    @Query(value = "SELECT DISTINCT b.* FROM books b " +
           "LEFT JOIN book_authors ba ON b.id = ba.book_id " +
           "LEFT JOIN authors a ON ba.author_id = a.id " +
           "WHERE to_tsvector('english', b.title) @@ plainto_tsquery('english', :searchTerm) " +
           "OR to_tsvector('english', a.name) @@ plainto_tsquery('english', :searchTerm) " +
           "ORDER BY b.id " +
           "LIMIT 50",
           nativeQuery = true)
    List<Book> searchByTitleOrAuthorFullText(@Param("searchTerm") String searchTerm);

    /**
     * Search books by title or author name with pagination and relevance ranking
     * Uses UNION of two separate GIN index scans for optimal performance with 1M+ books
     * Each sub-query uses its respective GIN index, then results are combined
     *
     * @param searchTerm the search term to match against book title or author name
     * @param pageable pagination parameters (page, size, sort)
     * @return paginated list of books matching the search criteria, ordered by relevance
     */
    @Query(value = "WITH search_results AS (" +
           "  SELECT b.id, ts_rank(to_tsvector('english', b.title), plainto_tsquery('english', :searchTerm)) as rank " +
           "  FROM books b " +
           "  WHERE to_tsvector('english', b.title) @@ plainto_tsquery('english', :searchTerm) " +
           "  UNION " +
           "  SELECT DISTINCT b.id, ts_rank(to_tsvector('english', a.name), plainto_tsquery('english', :searchTerm)) as rank " +
           "  FROM books b " +
           "  JOIN book_authors ba ON b.id = ba.book_id " +
           "  JOIN authors a ON ba.author_id = a.id " +
           "  WHERE to_tsvector('english', a.name) @@ plainto_tsquery('english', :searchTerm) " +
           ") " +
           "SELECT b.* FROM search_results sr " +
           "JOIN books b ON b.id = sr.id " +
           "ORDER BY sr.rank DESC, b.id",
           countQuery = "SELECT COUNT(DISTINCT id) FROM (" +
                       "  SELECT b.id FROM books b " +
                       "  WHERE to_tsvector('english', b.title) @@ plainto_tsquery('english', :searchTerm) " +
                       "  UNION " +
                       "  SELECT b.id FROM books b " +
                       "  JOIN book_authors ba ON b.id = ba.book_id " +
                       "  JOIN authors a ON ba.author_id = a.id " +
                       "  WHERE to_tsvector('english', a.name) @@ plainto_tsquery('english', :searchTerm) " +
                       ") AS combined",
           nativeQuery = true)
    Page<Book> searchByTitleOrAuthorPaginated(@Param("searchTerm") String searchTerm, Pageable pageable);
}
