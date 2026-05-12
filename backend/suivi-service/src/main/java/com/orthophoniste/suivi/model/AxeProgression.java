package com.orthophoniste.suivi.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AxeProgression {
    private String nom;
    private int pourcentage;
    private String commentaire;
}