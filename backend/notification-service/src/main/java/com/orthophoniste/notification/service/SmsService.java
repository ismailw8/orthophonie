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
public class SmsService {

    private final TwilioConfig twilioConfig;

    public NotificationResponse sendSms(String phone, String messageBody) {
        try {
            Message message = Message.creator(
                    new PhoneNumber(phone),
                    new PhoneNumber(twilioConfig.getPhoneNumber()),
                    messageBody
            ).create();

            log.info("SMS envoyé à {} — SID: {}", phone, message.getSid());

            return NotificationResponse.builder()
                    .sid(message.getSid())
                    .phone(phone)
                    .message(messageBody)
                    .channel(NotificationChannel.SMS)
                    .status(NotificationStatus.ENVOYE)
                    .sentAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Échec SMS vers {} : {}", phone, e.getMessage());

            return NotificationResponse.builder()
                    .phone(phone)
                    .message(messageBody)
                    .channel(NotificationChannel.SMS)
                    .status(NotificationStatus.ECHOUE)
                    .errorMessage(e.getMessage())
                    .sentAt(LocalDateTime.now())
                    .build();
        }
    }
}