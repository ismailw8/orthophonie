package com.orthophoniste.auth.service;

import com.orthophoniste.auth.dto.*;
import com.orthophoniste.auth.model.*;
import com.orthophoniste.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final KeycloakAdminService keycloak;

    public PatientResponse register(RegisterRequest request) { return registerWithRole(request, Role.ROLE_USER); }
    public PatientResponse registerWithRole(RegisterRequest request, Role role) {
        String email = request.getEmail().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new IllegalArgumentException("Email déjà utilisé");
        String keycloakId = keycloak.createUser(email, request.getFirstName(), request.getLastName(), request.getPassword(), role.name());
        LocalDateTime now = LocalDateTime.now();
        User user = users.save(User.builder().keycloakId(keycloakId).email(email).firstName(request.getFirstName())
                .lastName(request.getLastName()).phone(request.getPhone()).role(role).enabled(true).createdAt(now).updatedAt(now).build());
        return toResponse(user);
    }
    public List<PatientResponse> listPatients() { return users.findByRoleOrderByLastNameAscFirstNameAsc(Role.ROLE_USER).stream().map(this::toResponse).toList(); }
    public void resetPatientPassword(String id, String password) {
        User user=users.findById(id).orElseThrow(()->new IllegalArgumentException("Patient introuvable"));
        if(user.getRole()!=Role.ROLE_USER) throw new IllegalArgumentException("Ce compte n'est pas un compte patient");
        if(user.getKeycloakId()==null) throw new IllegalStateException("Ce profil doit être rattaché à Keycloak avant réinitialisation");
        keycloak.resetPassword(user.getKeycloakId(), password);
    }
    private PatientResponse toResponse(User u){return PatientResponse.builder().id(u.getId()).firstName(u.getFirstName()).lastName(u.getLastName()).email(u.getEmail()).phone(u.getPhone()).enabled(u.isEnabled()).build();}
}
