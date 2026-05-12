package com.orthophoniste.notification.dto;

import com.orthophoniste.notification.model.NotificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationRequest {

    @NotBlank(message = "Numéro de téléphone requis")
    private String phone;

    @NotBlank(message = "Message requis")
    private String message;

    @NotNull(message = "Canal requis : SMS ou WHATSAPP")
    private NotificationChannel channel;
}