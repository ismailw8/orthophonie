package com.orthophoniste.suivi.dto;

import com.orthophoniste.suivi.model.AxeProgression;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class BilanRequest {

    @NotBlank(message = "Patient ID requis")
    private String patientId;

    @NotBlank(message = "Email patient requis")
    private String patientEmail;

    @NotBlank(message = "Nom patient requis")
    private String patientNom;

    @Min(0)
    private int seancesEffectuees;

    @Min(1)
    private int seancesPrevues;

    @Min(0) @Max(100)
    private int progressionGlobale;

    private List<AxeProgression> axes;
    private String remarques;
}