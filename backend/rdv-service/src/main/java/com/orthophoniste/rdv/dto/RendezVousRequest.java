package com.orthophoniste.rdv.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RendezVousRequest {

    @NotBlank(message = "Prénom requis")
    @Size(max = 80, message = "Prénom trop long")
    private String firstName;

    @NotBlank(message = "Nom requis")
    @Size(max = 80, message = "Nom trop long")
    private String lastName;

    @NotBlank(message = "Téléphone requis")
    @Pattern(regexp = "^\\+?[0-9 .()-]{8,20}$", message = "Téléphone invalide")
    private String phone;

    @NotBlank(message = "Email requis")
    @Email(message = "Email invalide")
    @Size(max = 254, message = "Email trop long")
    private String email;

    @NotNull(message = "Date souhaitée requise")
    @FutureOrPresent(message = "La date ne peut pas être dans le passé")
    private LocalDate dateSouhaitee;

    @NotBlank(message = "Heure souhaitée requise")
    private String heureSouhaitee;

    @Size(max = 1000, message = "Motif trop long")
    private String motif;
}
