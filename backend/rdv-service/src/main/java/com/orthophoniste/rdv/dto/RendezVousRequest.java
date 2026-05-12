package com.orthophoniste.rdv.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RendezVousRequest {

    @NotBlank(message = "Prénom requis")
    private String firstName;

    @NotBlank(message = "Nom requis")
    private String lastName;

    @NotBlank(message = "Téléphone requis")
    private String phone;

    @Email(message = "Email invalide")
    private String email;

    @NotNull(message = "Date souhaitée requise")
    @Future(message = "La date doit être dans le futur")
    private LocalDate dateSouhaitee;

    private String motif;
}