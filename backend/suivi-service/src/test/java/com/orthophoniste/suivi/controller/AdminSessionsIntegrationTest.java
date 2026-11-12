package com.orthophoniste.suivi.controller;

import com.orthophoniste.suivi.config.SecurityConfig;
import com.orthophoniste.suivi.dto.SeanceResponse;
import com.orthophoniste.suivi.service.AuditService;
import com.orthophoniste.suivi.service.SuiviService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = AdminSessionsIntegrationTest.TestConfiguration.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"eureka.client.enabled=false", "spring.cloud.discovery.enabled=false"})
class AdminSessionsIntegrationTest {
    @Autowired private TestRestTemplate http;
    @MockitoBean private SuiviService service;
    @MockitoBean private AuditService audit;

    private ResponseEntity<String> get(String role) {
        var headers = new HttpHeaders();
        if (role != null) headers.setBearerAuth(role);
        return http.exchange("/api/suivi/admin/seances", HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    @Test void administratorGetsSessionsWithDatesAndPatientIdentity() {
        when(service.listerSeances()).thenReturn(List.of(SeanceResponse.builder()
                .id("session-1").patientId("patient-1").patientEmail("patient@example.com")
                .titre("Articulation").dateSeance(LocalDateTime.of(2026, 10, 22, 14, 45))
                .effectuee(false).build()));
        var response = get("ROLE_ADMIN");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("patient@example.com"));
        assertTrue(response.getBody().contains("2026-10-22T14:45:00"));
        verify(audit).record("admin@example.com", "READ_ALL", "SEANCE", null);
    }

    @Test void superAdministratorCanReadAnEmptyAgenda() {
        when(service.listerSeances()).thenReturn(List.of());
        var response = get("ROLE_SUPER_ADMIN");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("[]", response.getBody());
    }

    @Test void patientCannotReadOtherPatientsSessions() {
        assertEquals(HttpStatus.FORBIDDEN, get("ROLE_USER").getStatusCode());
        verifyNoInteractions(service, audit);
    }

    @Test void anonymousRequestMustAuthenticate() {
        assertEquals(HttpStatus.UNAUTHORIZED, get(null).getStatusCode());
        verifyNoInteractions(service, audit);
    }

    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration(exclude = {MongoAutoConfiguration.class,
            MongoDataAutoConfiguration.class, MongoRepositoriesAutoConfiguration.class})
    @Import({SecurityConfig.class, SuiviController.class})
    static class TestConfiguration {
        @Bean JwtDecoder jwtDecoder() {
            return role -> Jwt.withTokenValue(role).header("alg", "test")
                    .subject("test-subject").claim("email", "admin@example.com")
                    .claim("realm_access", Map.of("roles", List.of(role)))
                    .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(300)).build();
        }
    }
}
