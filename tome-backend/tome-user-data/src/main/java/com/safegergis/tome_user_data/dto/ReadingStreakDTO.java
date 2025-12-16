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
public class ReadingStreakDTO {
    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDate currentStreakStartDate;
    private LocalDate longestStreakStartDate;
    private LocalDate longestStreakEndDate;
    private List<LocalDate> activeDates;
}
