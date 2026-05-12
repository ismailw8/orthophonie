package com.orthophoniste.suivi.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "bilans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bilan {

    @Id
    private String id;

    @Indexed
    private String patientId;

    private String patientEmail;
    private String patientNom;

    private int seancesEffectuees;
    private int seancesPrevues;
    private int progressionGlobale;

    private List<AxeProgression> axes;
    private String remarques;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}