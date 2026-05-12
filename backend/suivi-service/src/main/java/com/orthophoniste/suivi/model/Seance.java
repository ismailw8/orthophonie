package com.orthophoniste.suivi.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "seances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seance {

    @Id
    private String id;

    @Indexed
    private String patientId;

    private String patientEmail;
    private String titre;
    private String description;
    private LocalDateTime dateSeance;
    private boolean effectuee;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}