package com.orthophoniste.rdv.dto;

import com.orthophoniste.rdv.model.RendezVousStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RendezVousResponse {

    private String id;

    private String firstName;
    private String lastName;

    private String phone;
    private String email;

    private LocalDate dateSouhaitee;

    private String heureSouhaitee;

    private String motif;

    private RendezVousStatus status;

    private LocalDateTime dateConfirmee;

    private String notes;

    private LocalDateTime createdAt;
}