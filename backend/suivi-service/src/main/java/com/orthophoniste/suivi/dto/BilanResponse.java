package com.orthophoniste.suivi.dto;

import com.orthophoniste.suivi.model.AxeProgression;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BilanResponse {
    private String id;
    private String patientId;
    private String patientEmail;
    private String patientNom;
    private int seancesEffectuees;
    private int seancesPrevues;
    private int progressionGlobale;
    private List<AxeProgression> axes;
    private String remarques;
    private LocalDateTime updatedAt;
}