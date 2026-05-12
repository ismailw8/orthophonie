package com.orthophoniste.rdv.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "rendezvous")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RendezVous {

    @Id
    private String id;

    private String firstName;
    private String lastName;

    @Indexed
    private String phone;

    private String email;

    private LocalDate dateSouhaitee;
    private String motif;

    private RendezVousStatus status;

    // rempli par le docteur après confirmation
    private LocalDateTime dateConfirmee;
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}