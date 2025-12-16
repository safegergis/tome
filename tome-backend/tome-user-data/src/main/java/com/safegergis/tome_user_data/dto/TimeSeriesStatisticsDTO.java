package com.safegergis.tome_user_data.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSeriesStatisticsDTO {
    private TimePeriod period;
    private List<TimeSeriesDataPoint> dataPoints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesDataPoint {
        private String label;
        private LocalDate startDate;
        private LocalDate endDate;
        private Long pagesRead;
        private Long minutesRead;
        private Integer sessionsCount;
    }

    public enum TimePeriod {
        WEEK, MONTH, YEAR
    }
}
