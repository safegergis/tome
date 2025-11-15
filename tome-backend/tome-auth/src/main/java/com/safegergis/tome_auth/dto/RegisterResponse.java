package com.safegergis.tome_auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    private Long userId;
    private String username;
    private String email;
    private String message;

    public RegisterResponse(String message) {
        this.message = message;
    }
}
