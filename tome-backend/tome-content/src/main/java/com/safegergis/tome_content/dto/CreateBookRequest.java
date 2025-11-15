package com.safegergis.tome_content.dto;

import java.time.LocalDate;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new book
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookRequest {
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
    private Set<Long> authorIds;
    private Set<Long> genreIds;
}
