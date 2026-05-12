package com.orthophoniste.rdv.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConfirmRequest {

    @NotNull(message = "Date de confirmation requise")
    private LocalDateTime dateConfirmee;

    private String notes;
}