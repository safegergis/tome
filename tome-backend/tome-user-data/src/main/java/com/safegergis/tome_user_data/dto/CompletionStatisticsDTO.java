package com.safegergis.tome_user_data.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletionStatisticsDTO {
    private Long totalStarted;
    private Long totalCompleted;
    private Long totalDnf;
    private Double completionRate;
    private Double dnfRate;
    private List<DnfReasonCount> dnfReasons;
    private ReadingVelocity velocity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DnfReasonCount {
        private String reason;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadingVelocity {
        private Double avgDaysToComplete;
        private Double avgPagesPerDay;
        private Double avgMinutesPerDay;
    }
}
