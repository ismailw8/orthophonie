package com.orthophoniste.rdv.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "indisponibilites")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Indisponibilite {

    @Id
    private String id;

    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String motif;  // "Congé", "Formation", "Férié", "Absent"

    private LocalDateTime createdAt;
}