package com.orthophoniste.auth.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String keycloakId;

    private String password;
    private String firstName;
    private String lastName;
    private String phone;

    private Role role;
    private boolean enabled;
    private int refreshTokenVersion;
    private boolean mustChangePassword;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
