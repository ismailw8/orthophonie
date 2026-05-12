package com.orthophoniste.notification.service;

import com.orthophoniste.notification.dto.NotificationRequest;
import com.orthophoniste.notification.dto.NotificationResponse;
import com.orthophoniste.notification.model.NotificationChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SmsService smsService;
    private final WhatsAppService whatsAppService;

    public NotificationResponse send(NotificationRequest request) {
        log.info("Envoi notification via {} vers {}",
                request.getChannel(), request.getPhone());

        if (request.getChannel() == NotificationChannel.WHATSAPP) {
            return whatsAppService.sendWhatsApp(
                    request.getPhone(),
                    request.getMessage()
            );
        }

        return smsService.sendSms(
                request.getPhone(),
                request.getMessage()
        );
    }
}