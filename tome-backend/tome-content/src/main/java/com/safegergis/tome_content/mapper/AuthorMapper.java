package com.safegergis.tome_content.mapper;

import com.safegergis.tome_content.dto.AuthorDTO;
import com.safegergis.tome_content.modal.Author;

/**
 * Mapper utility for converting between Author entities and DTOs
 */
public class AuthorMapper {

    /**
     * Converts an Author entity to an AuthorDTO
     */
    public static AuthorDTO toDTO(Author author) {
        if (author == null) {
            return null;
        }

        return AuthorDTO.builder()
                .id(author.getId())
                .name(author.getName())
                .bio(author.getBio())
                .birthYear(author.getBirthYear())
                .deathYear(author.getDeathYear())
                .photoUrl(author.getPhotoUrl())
                .externalId(author.getExternalId())
                .externalSource(author.getExternalSource())
                .createdAt(author.getCreatedAt())
                .updatedAt(author.getUpdatedAt())
                .build();
    }

    /**
     * Converts an AuthorDTO to an Author entity (for creation)
     */
    public static Author toEntity(AuthorDTO dto) {
        if (dto == null) {
            return null;
        }

        return Author.builder()
                .id(dto.getId())
                .name(dto.getName())
                .bio(dto.getBio())
                .birthYear(dto.getBirthYear())
                .deathYear(dto.getDeathYear())
                .photoUrl(dto.getPhotoUrl())
                .externalId(dto.getExternalId())
                .externalSource(dto.getExternalSource())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
