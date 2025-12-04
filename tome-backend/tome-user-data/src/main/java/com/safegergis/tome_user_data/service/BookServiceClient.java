package com.safegergis.tome_user_data.service;

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
}
