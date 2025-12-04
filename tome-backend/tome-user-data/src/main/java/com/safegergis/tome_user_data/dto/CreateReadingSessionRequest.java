package com.safegergis.tome_user_data.dto;

import java.time.LocalDate;

import com.safegergis.tome_user_data.enums.ReadingMethod;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateReadingSessionRequest {

    @NotNull(message = "Book ID is required")
    private Long bookId;

    @NotNull(message = "Reading method is required")
    private ReadingMethod readingMethod;

    @Min(value = 1, message = "Pages read must be positive")
    private Integer pagesRead;

    @Min(value = 1, message = "Minutes read must be positive")
    private Integer minutesRead;

    private LocalDate sessionDate; // Defaults to today if not provided

    @Min(value = 1, message = "Start page must be positive")
    private Integer startPage;

    @Min(value = 1, message = "End page must be positive")
    private Integer endPage;

    private String notes;
}
