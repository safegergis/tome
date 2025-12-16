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
public class ReadingMethodStatisticsDTO {
    private Long userId;
    private MethodBreakdown physical;
    private MethodBreakdown ebook;
    private MethodBreakdown audiobook;
    private ReadingMethod preferredMethod;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MethodBreakdown {
        private Integer booksCount;
        private Long pagesRead;
        private Long minutesRead;
        private Integer sessionsCount;
        private Double percentage;
    }
}
