package com.orthophoniste.rdv.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

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

    // Heure choisie par le patient : 09:00, 09:15...
    private String heureSouhaitee;

    /*
     * Clé utilisée pour empêcher deux rendez-vous
     * actifs sur le même créneau.
     *
     * Exemple :
     * 2026-08-06#09:00
     */
    @Indexed(
            name = "unique_active_slot",
            unique = true,
            partialFilter = "{ 'activeSlotKey': { $type: 'string' } }"
    )
    private String activeSlotKey;

    private String motif;

    private RendezVousStatus status;

    // rempli par le docteur après confirmation
    private LocalDateTime dateConfirmee;

    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}