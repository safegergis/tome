package com.safegergis.tome_user_data.dto;

import com.safegergis.tome_user_data.enums.ReadingStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserBookRequest {

    private ReadingStatus status;

    @Min(value = 0, message = "Current page must be non-negative")
    private Integer currentPage;

    @Min(value = 0, message = "Current seconds must be non-negative")
    private Integer currentSeconds;

    @Min(value = 1, message = "User page count must be positive")
    private Integer userPageCount;

    @Min(value = 1, message = "User audio length must be positive")
    private Integer userAudioLengthSeconds;

    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer personalRating;

    private String notes;
}
