package com.orthophoniste.suivi.model;

import lombok.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AxeProgression {
    @NotBlank
    private String nom;
    @Min(0)
    @Max(100)
    private int pourcentage;
    private String commentaire;
}
