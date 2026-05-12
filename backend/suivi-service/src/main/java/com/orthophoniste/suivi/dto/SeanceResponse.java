package com.orthophoniste.suivi.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeanceResponse {
    private String id;
    private String patientId;
    private String patientEmail;
    private String titre;
    private String description;
    private LocalDateTime dateSeance;
    private boolean effectuee;
    private LocalDateTime createdAt;
}