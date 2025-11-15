package com.safegergis.tome_content.mapper;

import java.util.stream.Collectors;

import com.safegergis.tome_content.dto.BookDTO;
import com.safegergis.tome_content.modal.Book;

/**
 * Mapper utility for converting between Book entities and DTOs
 */
public class BookMapper {

    /**
     * Converts a Book entity to a BookDTO
     */
    public static BookDTO toDTO(Book book) {
        if (book == null) {
            return null;
        }

        return BookDTO.builder()
                .id(book.getId())
                .title(book.getTitle())
                .subtitle(book.getSubtitle())
                .isbn10(book.getIsbn10())
                .isbn13(book.getIsbn13())
                .publisher(book.getPublisher())
                .publishedDate(book.getPublishedDate())
                .pageCount(book.getPageCount())
                .language(book.getLanguage())
                .description(book.getDescription())
                .coverUrl(book.getCoverUrl())
                .externalId(book.getExternalId())
                .externalSource(book.getExternalSource())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .authors(book.getAuthors() != null ?
                        book.getAuthors().stream()
                                .map(AuthorMapper::toDTO)
                                .collect(Collectors.toSet()) : null)
                .genres(book.getGenres() != null ?
                        book.getGenres().stream()
                                .map(GenreMapper::toDTO)
                                .collect(Collectors.toSet()) : null)
                .build();
    }

    /**
     * Converts a BookDTO to a Book entity (for creation)
     * Note: Does not set authors/genres - these should be set separately
     */
    public static Book toEntity(BookDTO dto) {
        if (dto == null) {
            return null;
        }

        return Book.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .subtitle(dto.getSubtitle())
                .isbn10(dto.getIsbn10())
                .isbn13(dto.getIsbn13())
                .publisher(dto.getPublisher())
                .publishedDate(dto.getPublishedDate())
                .pageCount(dto.getPageCount())
                .language(dto.getLanguage())
                .description(dto.getDescription())
                .coverUrl(dto.getCoverUrl())
                .externalId(dto.getExternalId())
                .externalSource(dto.getExternalSource())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
