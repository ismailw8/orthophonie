package com.orthophoniste.notification.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class TwilioConfig {

    @Value("${twilio.enabled:false}")
    private boolean enabled;

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String phoneNumber;

    @Value("${twilio.whatsapp-number}")
    private String whatsappNumber;

    @PostConstruct
    public void initTwilio() {
        if (enabled) {
            if (accountSid.isBlank() || authToken.isBlank() || phoneNumber.isBlank() || whatsappNumber.isBlank()) {
                throw new IllegalStateException("Configurer Twilio ou definir TWILIO_ENABLED=false");
            }
            Twilio.init(accountSid, authToken);
        }
    }
}