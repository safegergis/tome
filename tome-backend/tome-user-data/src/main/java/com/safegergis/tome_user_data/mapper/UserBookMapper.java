package com.safegergis.tome_user_data.mapper;

import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.UserBookDTO;
import com.safegergis.tome_user_data.model.UserBook;

/**
 * Mapper for converting UserBook entities to DTOs
 */
public class UserBookMapper {

    /**
     * Convert UserBook entity to DTO
     * Book summary must be provided separately (fetched from tome-content)
     */
    public static UserBookDTO toDTO(UserBook userBook, BookSummaryDTO bookSummary) {
        if (userBook == null) {
            return null;
        }

        Double progressPercentage = calculateProgressPercentage(userBook, bookSummary);

        return UserBookDTO.builder()
                .id(userBook.getId())
                .userId(userBook.getUserId())
                .bookId(userBook.getBookId())
                .book(bookSummary)
                .status(userBook.getStatus())
                .currentPage(userBook.getCurrentPage())
                .currentSeconds(userBook.getCurrentSeconds())
                .progressPercentage(progressPercentage)
                .userPageCount(userBook.getUserPageCount())
                .userAudioLengthSeconds(userBook.getUserAudioLengthSeconds())
                .personalRating(userBook.getPersonalRating())
                .notes(userBook.getNotes())
                .startedAt(userBook.getStartedAt())
                .finishedAt(userBook.getFinishedAt())
                .dnfDate(userBook.getDnfDate())
                .dnfReason(userBook.getDnfReason())
                .createdAt(userBook.getCreatedAt())
                .updatedAt(userBook.getUpdatedAt())
                .build();
    }

    /**
     * Calculate reading progress percentage
     * Uses user-specific page count if available, otherwise falls back to book's page count
     */
    private static Double calculateProgressPercentage(UserBook userBook, BookSummaryDTO bookSummary) {
        if (userBook == null || bookSummary == null) {
            return 0.0;
        }

        // Determine effective total (user override or book default)
        Integer effectivePageCount = userBook.getUserPageCount() != null
                ? userBook.getUserPageCount()
                : (bookSummary.getPageCount() != null ? bookSummary.getPageCount() : bookSummary.getEbookPageCount());

        Integer effectiveAudioLength = userBook.getUserAudioLengthSeconds() != null
                ? userBook.getUserAudioLengthSeconds()
                : bookSummary.getAudioLengthSeconds();

        // Calculate percentage based on what's available
        // Prioritize audiobook progress if currentSeconds > 0 (user is listening to audiobook)
        if (effectiveAudioLength != null && effectiveAudioLength > 0
                && userBook.getCurrentSeconds() != null && userBook.getCurrentSeconds() > 0) {
            double percentage = (userBook.getCurrentSeconds().doubleValue() / effectiveAudioLength.doubleValue()) * 100.0;
            return Math.min(percentage, 100.0); // Cap at 100%
        }

        // Fall back to page-based progress if no audiobook progress
        if (effectivePageCount != null && effectivePageCount > 0
                && userBook.getCurrentPage() != null && userBook.getCurrentPage() > 0) {
            double percentage = (userBook.getCurrentPage().doubleValue() / effectivePageCount.doubleValue()) * 100.0;
            return Math.min(percentage, 100.0); // Cap at 100%
        }

        return 0.0;
    }
}
