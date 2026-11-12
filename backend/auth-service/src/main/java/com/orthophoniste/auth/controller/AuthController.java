package com.orthophoniste.auth.controller;

import com.orthophoniste.auth.dto.*;
import com.orthophoniste.auth.model.Role;
import com.orthophoniste.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
 private final AuthService authService;
 @PostMapping("/register-patient") public PatientResponse registerPatient(@Valid @RequestBody RegisterRequest r){return authService.register(r);}
 @PostMapping("/register-admin") public PatientResponse registerAdmin(@Valid @RequestBody RegisterRequest r){return authService.registerWithRole(r, Role.ROLE_ADMIN);}
 @GetMapping("/admin/patients") public List<PatientResponse> patients(){return authService.listPatients();}
 @PutMapping("/admin/patients/{id}/reset-password") public ResponseEntity<Void> reset(@PathVariable String id,@Valid @RequestBody ResetPatientPasswordRequest r){authService.resetPatientPassword(id,r.getTemporaryPassword());return ResponseEntity.noContent().build();}
}
