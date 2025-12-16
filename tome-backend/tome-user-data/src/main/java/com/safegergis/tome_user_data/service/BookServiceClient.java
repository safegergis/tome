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

import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.exception.ResourceNotFoundException;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Client service for communicating with tome-content service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookServiceClient {

    private final RestTemplate restTemplate;

    @Value("${tome.content.service.url}")
    private String contentServiceUrl;

    /**
     * Fetch book details from tome-content service
     * Results are cached to reduce inter-service calls
     */
    @Cacheable(value = "books", key = "#bookId")
    @CircuitBreaker(name = "book-service", fallbackMethod = "getBookFallback")
    public BookSummaryDTO getBook(Long bookId) {
        try {
            log.debug("Fetching book {} from tome-content service", bookId);
            String url = contentServiceUrl + "/api/books/" + bookId;
            BookDTO fullBook = restTemplate.getForObject(url, BookDTO.class);

            if (fullBook == null) {
                throw new ResourceNotFoundException("Book", bookId);
            }

            return toBookSummary(fullBook);
        } catch (HttpClientErrorException.NotFound e) {
            log.error("Book {} not found in tome-content service", bookId);
            throw new ResourceNotFoundException("Book", bookId);
        } catch (Exception e) {
            log.error("Error fetching book {} from tome-content service: {}", bookId, e.getMessage());
            throw e;
        }
    }

    /**
     * Fetch multiple books at once (batch operation)
     * Useful for enriching activity feeds and paginated results
     */
    public Map<Long, BookSummaryDTO> getBooks(Set<Long> bookIds) {
        log.debug("Fetching {} books from tome-content service", bookIds.size());

        Map<Long, BookSummaryDTO> books = new HashMap<>();
        for (Long bookId : bookIds) {
            try {
                BookSummaryDTO book = getBook(bookId);
                books.put(bookId, book);
            } catch (Exception e) {
                log.warn("Failed to fetch book {}: {}", bookId, e.getMessage());
                // Add fallback book on error
                books.put(bookId, getBookFallback(bookId, e));
            }
        }

        return books;
    }

    /**
     * Fallback method when tome-content service is unavailable
     * Returns partial data with just the ID
     */
    private BookSummaryDTO getBookFallback(Long bookId, Exception ex) {
        log.warn("Using fallback for book {}: {}", bookId, ex.getMessage());
        return BookSummaryDTO.builder()
                .id(bookId)
                .title("Book information temporarily unavailable")
                .build();
    }

    /**
     * Convert full BookDTO to minimal BookSummaryDTO
     */
    private BookSummaryDTO toBookSummary(BookDTO book) {
        return BookSummaryDTO.builder()
                .id(book.getId())
                .title(book.getTitle())
                .isbn10(book.getIsbn10())
                .isbn13(book.getIsbn13())
                .coverUrl(book.getCoverUrl())
                .authorNames(book.getAuthors() != null
                        ? book.getAuthors().stream()
                                .map(AuthorDTO::getName)
                                .collect(Collectors.toSet())
                        : Set.of())
                .pageCount(book.getPageCount())
                .ebookPageCount(book.getEbookPageCount())
                .audioLengthSeconds(book.getAudioLengthSeconds())
                .build();
    }

    /**
     * Inner DTO for receiving Book data from tome-content
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    static class BookDTO {
        private Long id;
        private String title;
        private String isbn10;
        private String isbn13;
        private String coverUrl;
        private Integer pageCount;
        private Integer ebookPageCount;
        private Integer audioLengthSeconds;
        private Set<AuthorDTO> authors;
    }

    /**
     * Inner DTO for receiving Author data from tome-content
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    static class AuthorDTO {
        private Long id;
        private String name;
    }

    /**
     * Inner DTO for receiving Genre data from tome-content
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    static class GenreDTO {
        private Long id;
        private String name;
    }

    /**
     * Extended BookDTO with full details including genres
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    static class BookDetailDTO extends BookDTO {
        private Set<GenreDTO> genres;
    }

    /**
     * Fetch multiple books with full details (genres and authors)
     * Used for statistics aggregation
     */
    public Map<Long, BookDetailDTO> getBooksWithDetails(Set<Long> bookIds) {
        log.debug("Fetching {} books with full details from tome-content service", bookIds.size());

        Map<Long, BookDetailDTO> books = new HashMap<>();
        for (Long bookId : bookIds) {
            try {
                String url = contentServiceUrl + "/api/books/" + bookId;
                BookDetailDTO book = restTemplate.getForObject(url, BookDetailDTO.class);

                if (book != null) {
                    books.put(bookId, book);
                } else {
                    log.warn("Book {} returned null from tome-content service", bookId);
                }
            } catch (HttpClientErrorException.NotFound e) {
                log.warn("Book {} not found in tome-content service", bookId);
            } catch (Exception e) {
                log.error("Error fetching book {} with details: {}", bookId, e.getMessage());
            }
        }

        return books;
    }
}
