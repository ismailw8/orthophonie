package com.orthophoniste.rdv.client;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;

public class NotificationFeignConfig {
    @Bean
    RequestInterceptor internalAuthorizationInterceptor(InternalTokenService tokenService) {
        return template -> template.header("Authorization", "Bearer " + tokenService.generateToken());
    }
}
