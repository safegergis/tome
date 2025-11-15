package com.safegergis.tome_content.mapper;

import com.safegergis.tome_content.dto.GenreDTO;
import com.safegergis.tome_content.modal.Genre;

/**
 * Mapper utility for converting between Genre entities and DTOs
 */
public class GenreMapper {

    /**
     * Converts a Genre entity to a GenreDTO
     */
    public static GenreDTO toDTO(Genre genre) {
        if (genre == null) {
            return null;
        }

        return GenreDTO.builder()
                .id(genre.getId())
                .name(genre.getName())
                .description(genre.getDescription())
                .createdAt(genre.getCreatedAt())
                .build();
    }

    /**
     * Converts a GenreDTO to a Genre entity (for creation)
     */
    public static Genre toEntity(GenreDTO dto) {
        if (dto == null) {
            return null;
        }

        return Genre.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
