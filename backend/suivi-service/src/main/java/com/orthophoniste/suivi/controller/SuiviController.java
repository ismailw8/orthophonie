package com.orthophoniste.suivi.controller;

import com.orthophoniste.suivi.dto.*;
import com.orthophoniste.suivi.service.SuiviService;
import com.orthophoniste.suivi.service.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/suivi")
@RequiredArgsConstructor
public class SuiviController {

    private final SuiviService service;
    private final AuditService auditService;

    @GetMapping("/creneaux-occupes")
    public ResponseEntity<List<String>> creneauxOccupes(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.listerCreneauxOccupes(date));
    }

    // ── PATIENT ──────────────────────────────────────────────

    @GetMapping("/mon-dashboard")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<DashboardResponse> monDashboard(Authentication auth) {
        auditService.record(auth.getName(), "READ_OWN", "SUIVI", null);
        return ResponseEntity.ok(service.getDashboard(auth.getName()));
    }

    // ── ADMIN ────────────────────────────────────────────────

    @GetMapping("/admin/bilans")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BilanResponse>> listerBilans(Authentication auth) {
        auditService.record(auth.getName(), "READ_ALL", "BILAN", null);
        return ResponseEntity.ok(service.listerBilans());
    }

    @PostMapping("/admin/bilans")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BilanResponse> creerBilan(
            @Valid @RequestBody BilanRequest request, Authentication auth) {
        var response = service.creerOuMettreAJourBilan(request);
        auditService.record(auth.getName(), "CREATE", "BILAN", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/admin/bilans")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BilanResponse> mettreAJourBilan(
            @Valid @RequestBody BilanRequest request, Authentication auth) {
        var response = service.creerOuMettreAJourBilan(request);
        auditService.record(auth.getName(), "UPDATE", "BILAN", response.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/seances")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SeanceResponse>> listerSeances(Authentication auth) {
        auditService.record(auth.getName(), "READ_ALL", "SEANCE", null);
        return ResponseEntity.ok(service.listerSeances());
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
