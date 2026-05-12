package com.orthophoniste.notification.dto;

import com.orthophoniste.notification.model.NotificationChannel;
import com.orthophoniste.notification.model.NotificationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String sid;
    private String phone;
    private String message;
    private NotificationChannel channel;
    private NotificationStatus status;
    private String errorMessage;
    private LocalDateTime sentAt;
}