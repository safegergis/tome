package com.safegergis.tome_content.repository;

import java.util.List;
import java.util.Optional;

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
     * Search books by title or author name (case-insensitive partial match)
     *
     * @param searchTerm the search term to match against book title or author name
     * @return list of books matching the search criteria
     */
    @Query("SELECT DISTINCT b FROM Book b LEFT JOIN b.authors a " +
           "WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(a.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Book> searchByTitleOrAuthor(@Param("searchTerm") String searchTerm);
}
