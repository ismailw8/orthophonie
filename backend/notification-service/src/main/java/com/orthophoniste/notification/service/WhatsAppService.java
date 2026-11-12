package com.orthophoniste.notification.service;

import com.orthophoniste.notification.config.TwilioConfig;
import com.orthophoniste.notification.dto.NotificationResponse;
import com.orthophoniste.notification.model.NotificationChannel;
import com.orthophoniste.notification.model.NotificationStatus;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final TwilioConfig twilioConfig;

    public NotificationResponse sendWhatsApp(String phone, String messageBody) {
        try {
            if (!twilioConfig.isEnabled()) {
                throw new IllegalStateException("Envoi desactive : TWILIO_ENABLED=false");
            }
            // Twilio WhatsApp nécessite le préfixe "whatsapp:"
            String destination = phone.startsWith("whatsapp:")
                    ? phone
                    : "whatsapp:" + phone;

            Message message = Message.creator(
                    new PhoneNumber(destination),
                    new PhoneNumber(twilioConfig.getWhatsappNumber()),
                    messageBody
            ).create();

            log.info("WhatsApp envoyé à {} — SID: {}", phone, message.getSid());

            return NotificationResponse.builder()
                    .sid(message.getSid())
                    .phone(phone)
                    .message(messageBody)
                    .channel(NotificationChannel.WHATSAPP)
                    .status(NotificationStatus.ENVOYE)
                    .sentAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Échec WhatsApp vers {} : {}", phone, e.getMessage());

            return NotificationResponse.builder()
                    .phone(phone)
                    .message(messageBody)
                    .channel(NotificationChannel.WHATSAPP)
                    .status(NotificationStatus.ECHOUE)
                    .errorMessage(e.getMessage())
                    .sentAt(LocalDateTime.now())
                    .build();
        }
    }
}