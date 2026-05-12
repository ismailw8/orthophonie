package com.orthophoniste.suivi.controller;

import com.orthophoniste.suivi.dto.*;
import com.orthophoniste.suivi.service.SuiviService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suivi")
@RequiredArgsConstructor
public class SuiviController {

    private final SuiviService service;

    // ── PATIENT ──────────────────────────────────────────────

    @GetMapping("/mon-dashboard")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<DashboardResponse> monDashboard(Authentication auth) {
        return ResponseEntity.ok(service.getDashboard(auth.getName()));
    }

    // ── ADMIN ────────────────────────────────────────────────

    @GetMapping("/admin/bilans")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BilanResponse>> listerBilans() {
        return ResponseEntity.ok(service.listerBilans());
    }

    @PostMapping("/admin/bilans")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BilanResponse> creerBilan(
            @Valid @RequestBody BilanRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.creerOuMettreAJourBilan(request));
    }

    @PutMapping("/admin/bilans")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BilanResponse> mettreAJourBilan(
            @Valid @RequestBody BilanRequest request) {
        return ResponseEntity.ok(service.creerOuMettreAJourBilan(request));
    }

    @PostMapping("/admin/seances")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SeanceResponse> ajouterSeance(
            @Valid @RequestBody SeanceRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.ajouterSeance(request));
    }

    @PutMapping("/admin/seances/{id}/effectuee")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<SeanceResponse> marquerEffectuee(@PathVariable String id) {
        return ResponseEntity.ok(service.marquerSeanceEffectuee(id));
    }

    @GetMapping("/admin/seances/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SeanceResponse>> seancesPatient(
            @PathVariable String patientId) {
        return ResponseEntity.ok(service.listerSeancesPatient(patientId));
    }

    @DeleteMapping("/admin/seances/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> supprimerSeance(@PathVariable String id) {
        service.supprimerSeance(id);
        return ResponseEntity.noContent().build();
    }
}