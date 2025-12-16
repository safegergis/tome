package com.safegergis.tome_user_data.dto;

import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary information about a list for activity feed
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListSummaryDTO {
    private Long id;
    private String name;
    private String description;
    private Boolean isPublic;
    private Long bookCount;
    private OffsetDateTime createdAt;
}
