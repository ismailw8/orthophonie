package com.orthophoniste.auth.dto;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String userId;
    private String accessToken;
    @JsonIgnore
    private String refreshToken;
    private String tokenType;
    private String role;
    private String email;
    private String firstName;
    private boolean mustChangePassword;
}
