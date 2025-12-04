package com.safegergis.tome_user_data.mapper;

import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.ReadingSessionDTO;
import com.safegergis.tome_user_data.model.ReadingSession;

/**
 * Mapper for converting ReadingSession entities to DTOs
 */
public class ReadingSessionMapper {

    /**
     * Convert ReadingSession entity to DTO
     * Book summary must be provided separately (fetched from tome-content)
     */
    public static ReadingSessionDTO toDTO(ReadingSession session, BookSummaryDTO bookSummary) {
        if (session == null) {
            return null;
        }

        return ReadingSessionDTO.builder()
                .id(session.getId())
                .userId(session.getUserId())
                .bookId(session.getBookId())
                .book(bookSummary)
                .pagesRead(session.getPagesRead())
                .minutesRead(session.getMinutesRead())
                .readingMethod(session.getReadingMethod())
                .sessionDate(session.getSessionDate())
                .startPage(session.getStartPage())
                .endPage(session.getEndPage())
                .notes(session.getNotes())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}
