package com.orthophoniste.rdv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class IndisponibiliteRequest {

    @NotNull(message = "Date de début requise")
    private LocalDate dateDebut;

    @NotNull(message = "Date de fin requise")
    private LocalDate dateFin;

    @NotBlank(message = "Motif requis")
    private String motif;
}