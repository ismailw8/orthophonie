package com.orthophoniste.rdv.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private String phone;
    private String message;
    private String channel; // SMS ou WHATSAPP
}