package com.safegergis.tome_user_data.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenreStatisticsDTO {
    private Long genreId;
    private String genreName;
    private Long booksRead;
    private Long booksCurrentlyReading;
    private Long booksWantToRead;
    private Long totalBooks;
}
