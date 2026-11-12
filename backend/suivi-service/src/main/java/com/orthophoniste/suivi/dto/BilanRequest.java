package com.orthophoniste.suivi.dto;

import com.orthophoniste.suivi.model.AxeProgression;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;
import jakarta.validation.Valid;

@Data
public class BilanRequest {

    @NotBlank(message = "Patient ID requis")
    private String patientId;

    @NotBlank(message = "Email patient requis")
    @Email(message = "Email patient invalide")
    private String patientEmail;

    @NotBlank(message = "Nom patient requis")
    private String patientNom;

    @Min(0)
    private int seancesEffectuees;

    @Min(value = 0, message = "Le nombre de séances prévues ne peut pas être négatif")
    private int seancesPrevues;

    @Min(0) @Max(100)
    private int progressionGlobale;

    private List<@Valid AxeProgression> axes;
    private String remarques;
}
