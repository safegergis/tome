package com.safegergis.tome_user_data.dto;

import java.time.OffsetDateTime;

import com.safegergis.tome_user_data.enums.ReadingStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBookDTO {
    private Long id;
    private Long userId;
    private String username;
    private Long bookId;
    private BookSummaryDTO book;
    private ReadingStatus status;
    private Integer currentPage;
    private Integer currentSeconds;
    private Double progressPercentage;
    private Integer userPageCount;
    private Integer userAudioLengthSeconds;
    private Integer personalRating;
    private String notes;
    private OffsetDateTime startedAt;
    private OffsetDateTime finishedAt;
    private OffsetDateTime dnfDate;
    private String dnfReason;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
