package com.orthophoniste.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import java.net.URI;
import java.util.*;

@Service
public class KeycloakAdminService {
    private final RestClient client = RestClient.create();
    @Value("${keycloak.server-url}") String serverUrl;
    @Value("${keycloak.realm}") String realm;
    @Value("${keycloak.admin-client-id}") String clientId;
    @Value("${keycloak.admin-client-secret}") String clientSecret;

    public String createUser(String email, String firstName, String lastName, String password, String role) {
        Map<String,Object> body = new LinkedHashMap<>();
        body.put("username", email); body.put("email", email); body.put("emailVerified", true);
        body.put("firstName", firstName); body.put("lastName", lastName); body.put("enabled", true);
        body.put("requiredActions", List.of("UPDATE_PASSWORD"));
        body.put("credentials", List.of(Map.of("type", "password", "value", password, "temporary", true)));
        URI location = client.post().uri(adminUrl("/users")).headers(h -> h.setBearerAuth(token()))
                .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().toBodilessEntity().getHeaders().getLocation();
        if (location == null) throw new IllegalStateException("Keycloak n'a pas retourné l'identifiant utilisateur");
        String userId = location.getPath().substring(location.getPath().lastIndexOf('/') + 1);
        Map<?,?> roleRepresentation = client.get().uri(adminUrl("/roles/" + role)).headers(h -> h.setBearerAuth(token())).retrieve().body(Map.class);
        client.post().uri(adminUrl("/users/" + userId + "/role-mappings/realm")).headers(h -> h.setBearerAuth(token()))
                .contentType(MediaType.APPLICATION_JSON).body(List.of(roleRepresentation)).retrieve().toBodilessEntity();
        return userId;
    }

    public void resetPassword(String userId, String password) {
        client.put().uri(adminUrl("/users/" + userId + "/reset-password")).headers(h -> h.setBearerAuth(token()))
                .contentType(MediaType.APPLICATION_JSON).body(Map.of("type", "password", "value", password, "temporary", true))
                .retrieve().toBodilessEntity();
        client.put().uri(adminUrl("/users/" + userId)).headers(h -> h.setBearerAuth(token()))
                .contentType(MediaType.APPLICATION_JSON).body(Map.of("requiredActions", List.of("UPDATE_PASSWORD"))).retrieve().toBodilessEntity();
    }

    private String token() {
        LinkedMultiValueMap<String,String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials"); form.add("client_id", clientId); form.add("client_secret", clientSecret);
        Map<?,?> response = client.post().uri(serverUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Map.class);
        return Objects.toString(response.get("access_token"));
    }
    private String adminUrl(String path) { return serverUrl + "/admin/realms/" + realm + path; }
}
