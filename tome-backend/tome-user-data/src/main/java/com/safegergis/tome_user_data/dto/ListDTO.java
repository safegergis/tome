package com.safegergis.tome_user_data.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.safegergis.tome_user_data.enums.ListType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListDTO {
    private Long id;
    private Long userId;
    private String username;
    private String name;
    private String description;
    private Boolean isPublic;
    private Boolean isDefault;
    private ListType listType;
    private Integer bookCount;
    private List<BookSummaryDTO> books; // Optional, may be null if not requested
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
