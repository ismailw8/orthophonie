package com.orthophoniste.notification.controller;

import com.orthophoniste.notification.dto.NotificationRequest;
import com.orthophoniste.notification.dto.NotificationResponse;
import com.orthophoniste.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> send(
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.send(request));
    }
}