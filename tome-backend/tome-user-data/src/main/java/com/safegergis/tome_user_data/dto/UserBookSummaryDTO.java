package com.safegergis.tome_user_data.dto;

import java.time.OffsetDateTime;

import com.safegergis.tome_user_data.enums.ReadingStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary information about a user book for activity feed
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBookSummaryDTO {
    private Long id;
    private Long bookId;
    private BookSummaryDTO book;
    private ReadingStatus status;
    private OffsetDateTime finishedAt;
}
