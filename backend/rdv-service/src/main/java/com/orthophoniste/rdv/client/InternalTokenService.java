package com.orthophoniste.rdv.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import java.time.Instant;
import java.util.Map;

@Service
public class InternalTokenService {
    private final RestClient client;
    private final String tokenUrl;
    private final String clientId;
    private final String clientSecret;
    private String accessToken;
    private Instant expiresAt = Instant.EPOCH;

    public InternalTokenService(RestClient.Builder builder,
            @Value("${keycloak.server-url}") String serverUrl,
            @Value("${keycloak.realm}") String realm,
            @Value("${keycloak.service-client-id}") String clientId,
            @Value("${keycloak.service-client-secret}") String clientSecret) {
        this.client = builder.build();
        this.tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public synchronized String generateToken() {
        if (accessToken != null && Instant.now().isBefore(expiresAt.minusSeconds(30))) return accessToken;
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        Map<?, ?> response = client.post().uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form)
                .retrieve().body(Map.class);
        if (response == null || !(response.get("access_token") instanceof String token)
                || !(response.get("expires_in") instanceof Number duration)) {
            throw new IllegalStateException("Keycloak n'a pas retourne de jeton de service valide");
        }
        accessToken = token;
        expiresAt = Instant.now().plusSeconds(duration.longValue());
        return accessToken;
    }
}