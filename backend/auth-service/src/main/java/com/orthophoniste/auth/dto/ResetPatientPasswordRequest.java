package com.orthophoniste.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPatientPasswordRequest {
    @NotBlank(message = "Mot de passe requis")
    @Size(min = 12, message = "Le mot de passe temporaire doit contenir au moins 12 caractères")
    private String temporaryPassword;
}
