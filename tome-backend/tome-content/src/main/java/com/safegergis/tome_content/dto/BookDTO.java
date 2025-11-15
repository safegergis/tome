package com.safegergis.tome_content.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for Book entity
 * Used for API responses to avoid exposing entity structure
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookDTO {
    private Long id;
    private String title;
    private String subtitle;
    private String isbn10;
    private String isbn13;
    private String publisher;
    private LocalDate publishedDate;
    private Integer pageCount;
    private String language;
    private String description;
    private String coverUrl;
    private String externalId;
    private String externalSource;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Set<AuthorDTO> authors;
    private Set<GenreDTO> genres;
}
