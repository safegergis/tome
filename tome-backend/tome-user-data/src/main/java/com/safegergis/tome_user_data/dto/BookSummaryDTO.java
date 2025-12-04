package com.safegergis.tome_user_data.dto;

import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal book information fetched from tome-content service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookSummaryDTO {
    private Long id;
    private String title;
    private String coverUrl;
    private Set<String> authorNames;
    private Integer pageCount;
    private Integer ebookPageCount;
    private Integer audioLengthSeconds;
}
