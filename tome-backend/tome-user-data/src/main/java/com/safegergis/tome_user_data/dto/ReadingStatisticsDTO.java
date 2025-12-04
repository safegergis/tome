package com.safegergis.tome_user_data.dto;

import com.safegergis.tome_user_data.enums.ReadingMethod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingStatisticsDTO {
    private Long userId;
    private Long sessionsThisWeek;
    private Long pagesThisWeek;
    private Long minutesThisWeek;
    private Long sessionsThisMonth;
    private Long pagesThisMonth;
    private Long minutesThisMonth;
    private Long currentlyReadingCount;
    private Long readCount;
    private Long wantToReadCount;
    private Long didNotFinishCount;
    private ReadingMethod preferredMethod;
}
