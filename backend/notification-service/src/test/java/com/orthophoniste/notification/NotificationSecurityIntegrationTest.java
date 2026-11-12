package com.orthophoniste.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class NotificationSecurityIntegrationTest {
    @Autowired
    private TestRestTemplate http;

    @MockitoBean
    private JwtDecoder decoder;

    @BeforeEach
    void configureTokens() {
        when(decoder.decode("service-token")).thenReturn(token("service-token", "ROLE_SERVICE"));
        when(decoder.decode("patient-token")).thenReturn(token("patient-token", "ROLE_USER"));
    }

    @Test
    void serviceTokenPreservesValidationErrorAcrossServletErrorDispatch() {
        assertEquals(HttpStatus.BAD_REQUEST, sendInvalidRequest("service-token"));
    }

    @Test
    void patientTokenCannotSendNotifications() {
        assertEquals(HttpStatus.FORBIDDEN, sendInvalidRequest("patient-token"));
    }

    @Test
    void missingTokenCannotSendNotifications() {
        assertEquals(HttpStatus.UNAUTHORIZED, sendInvalidRequest(null));
    }

    private HttpStatus sendInvalidRequest(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (accessToken != null) headers.setBearerAuth(accessToken);
        return HttpStatus.valueOf(http.postForEntity("/api/notifications/send",
                new HttpEntity<>("{}", headers), String.class).getStatusCode().value());
    }

    private Jwt token(String value, String role) {
        return Jwt.withTokenValue(value).header("alg", "RS256").subject("test-client")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(300))
                .claim("realm_access", Map.of("roles", List.of(role))).build();
    }
}
