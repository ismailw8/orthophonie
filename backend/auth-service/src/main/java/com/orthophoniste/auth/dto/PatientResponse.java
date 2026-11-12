package com.orthophoniste.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PatientResponse {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private boolean enabled;
}
