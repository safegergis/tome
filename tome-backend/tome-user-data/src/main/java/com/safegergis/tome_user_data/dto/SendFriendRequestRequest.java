package com.safegergis.tome_user_data.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for sending a friend request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendFriendRequestRequest {

    @NotNull(message = "Friend user ID is required")
    private Long friendUserId;
}
