package com.safegergis.tome_user_data.mapper;

import java.util.List;

import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.ListDTO;
import com.safegergis.tome_user_data.model.BookList;

/**
 * Mapper for converting BookList entities to DTOs
 */
public class ListMapper {

    /**
     * Convert BookList entity to DTO
     * Book summaries are optional and can be null
     */
    public static ListDTO toDTO(BookList list, List<BookSummaryDTO> books, Integer bookCount, String username) {
        if (list == null) {
            return null;
        }

        return ListDTO.builder()
                .id(list.getId())
                .userId(list.getUserId())
                .username(username)
                .name(list.getName())
                .description(list.getDescription())
                .isPublic(list.getIsPublic())
                .isDefault(list.getIsDefault())
                .listType(list.getListType())
                .bookCount(bookCount)
                .books(books)
                .createdAt(list.getCreatedAt())
                .updatedAt(list.getUpdatedAt())
                .build();
    }

    /**
     * Convert BookList entity to DTO without books
     */
    public static ListDTO toDTOWithoutBooks(BookList list, Integer bookCount, String username) {
        return toDTO(list, null, bookCount, username);
    }
}
