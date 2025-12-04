package com.safegergis.tome_user_data.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.safegergis.tome_user_data.enums.ReadingMethod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingSessionDTO {
    private Long id;
    private Long userId;
    private Long bookId;
    private BookSummaryDTO book;
    private Integer pagesRead;
    private Integer minutesRead;
    private ReadingMethod readingMethod;
    private LocalDate sessionDate;
    private Integer startPage;
    private Integer endPage;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
