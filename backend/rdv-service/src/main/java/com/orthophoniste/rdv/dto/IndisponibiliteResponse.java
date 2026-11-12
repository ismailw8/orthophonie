package com.orthophoniste.rdv.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndisponibiliteResponse {
    private String id;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String motif;
    private LocalDateTime createdAt;
}