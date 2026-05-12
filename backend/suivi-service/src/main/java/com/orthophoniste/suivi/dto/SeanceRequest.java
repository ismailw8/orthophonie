package com.orthophoniste.suivi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SeanceRequest {

    @NotBlank(message = "Patient ID requis")
    private String patientId;

    @NotBlank(message = "Email patient requis")
    private String patientEmail;

    @NotBlank(message = "Titre requis")
    private String titre;

    private String description;

    @NotNull(message = "Date de séance requise")
    private LocalDateTime dateSeance;
}