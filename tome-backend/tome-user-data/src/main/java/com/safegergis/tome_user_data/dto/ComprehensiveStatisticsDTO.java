package com.safegergis.tome_user_data.dto;

import java.util.List;

import com.safegergis.tome_user_data.enums.ReadingMethod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComprehensiveStatisticsDTO {
    private Long userId;
    private SummaryStats summary;
    private ReadingMethodBreakdown methodBreakdown;
    private List<GenreStatDTO> topGenres;
    private List<AuthorStatDTO> topAuthors;
    private ReadingStreakInfo streak;
    private CompletionMetrics completion;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStats {
        private Long totalBooksRead;
        private Long totalPagesRead;
        private Long totalMinutesRead;
        private Long currentlyReadingCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadingMethodBreakdown {
        private MethodStats physical;
        private MethodStats ebook;
        private MethodStats audiobook;
        private ReadingMethod preferredMethod;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class MethodStats {
            private Integer booksCount;
            private Long pagesRead;
            private Long minutesRead;
            private Integer sessionsCount;
            private Double percentage;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenreStatDTO {
        private Long genreId;
        private String genreName;
        private Long booksRead;
        private Long totalBooks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorStatDTO {
        private Long authorId;
        private String authorName;
        private Long booksRead;
        private Long totalBooks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadingStreakInfo {
        private Integer currentStreak;
        private Integer longestStreak;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompletionMetrics {
        private Long totalStarted;
        private Long totalCompleted;
        private Long totalDnf;
        private Double completionRate;
    }
}
