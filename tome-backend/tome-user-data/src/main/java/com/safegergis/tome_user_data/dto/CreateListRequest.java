package com.safegergis.tome_user_data.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateListRequest {

    @NotBlank(message = "List name is required")
    private String name;

    private String description;

    private Boolean isPublic = false;
}
