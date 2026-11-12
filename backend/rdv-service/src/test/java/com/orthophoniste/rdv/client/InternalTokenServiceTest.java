package com.orthophoniste.rdv.client;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class InternalTokenServiceTest {
    private MockRestServiceServer server;
    private InternalTokenService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new InternalTokenService(builder, "http://keycloak:8080", "orthophoniste",
                "rdv-service", "test-secret");
    }

    @Test
    void requestsAKeycloakServiceTokenAndReusesIt() {
        server.expect(requestTo("http://keycloak:8080/realms/orthophoniste/protocol/openid-connect/token"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(content().string("grant_type=client_credentials&client_id=rdv-service&client_secret=test-secret"))
                .andRespond(withSuccess("{\"access_token\":\"service-token\",\"expires_in\":300}", MediaType.APPLICATION_JSON));

        assertEquals("service-token", service.generateToken());
        assertEquals("service-token", service.generateToken());
        server.verify();
    }

    @Test
    void renewsATokenNearExpiry() {
        String url = "http://keycloak:8080/realms/orthophoniste/protocol/openid-connect/token";
        server.expect(requestTo(url)).andRespond(withSuccess(
                "{\"access_token\":\"old-token\",\"expires_in\":20}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(url)).andRespond(withSuccess(
                "{\"access_token\":\"new-token\",\"expires_in\":300}", MediaType.APPLICATION_JSON));

        assertEquals("old-token", service.generateToken());
        assertEquals("new-token", service.generateToken());
        server.verify();
    }

    @Test
    void rejectsAnIncompleteKeycloakResponse() {
        server.expect(requestTo("http://keycloak:8080/realms/orthophoniste/protocol/openid-connect/token"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        assertThrows(IllegalStateException.class, service::generateToken);
        server.verify();
    }
}
