package com.orthophoniste.rdv.controller;

import com.orthophoniste.rdv.dto.*;
import com.orthophoniste.rdv.model.RendezVousStatus;
import com.orthophoniste.rdv.service.RendezVousService;
import com.orthophoniste.rdv.service.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

import java.util.List;

@RestController
@RequestMapping("/api/rdv")
@RequiredArgsConstructor
public class RendezVousController {

    private final RendezVousService service;
    private final AuditService auditService;

    // ── PUBLIC ──────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<RendezVousResponse> creer(
            @Valid @RequestBody RendezVousRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.creerRendezVous(request));
    }
    @GetMapping("/creneaux-occupes")
    public ResponseEntity<List<String>> listerCreneauxOccupes(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date
    ) {

        return ResponseEntity.ok(
                service.listerCreneauxOccupes(date)
        );
    }
    // ── ADMIN ────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<RendezVousResponse>> listerTous(Authentication authentication) {
        auditService.record(authentication.getName(), "READ_ALL", "RENDEZ_VOUS", null);
        return ResponseEntity.ok(service.listerTous());
    }

    @GetMapping("/admin/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<RendezVousResponse>> listerParStatus(
            @PathVariable RendezVousStatus status) {
        return ResponseEntity.ok(service.listerParStatus(status));
    }

    @PutMapping("/admin/{id}/confirmer")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<RendezVousResponse> confirmer(
            @PathVariable String id,
            @Valid @RequestBody ConfirmRequest request, Authentication authentication) {
        var response = service.confirmerRendezVous(id, request);
        auditService.record(authentication.getName(), "CONFIRM", "RENDEZ_VOUS", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/admin/{id}/annuler")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<RendezVousResponse> annuler(@PathVariable String id, Authentication authentication) {
        var response = service.annulerRendezVous(id);
        auditService.record(authentication.getName(), "CANCEL", "RENDEZ_VOUS", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/mes-rendez-vous")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<RendezVousResponse>> mesRendezVous(Authentication authentication) {
        auditService.record(authentication.getName(), "READ_OWN", "RENDEZ_VOUS", null);
        return ResponseEntity.ok(service.listerMesRendezVous(authentication.getName()));
    }

    @PutMapping("/patient/{id}/annuler")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<RendezVousResponse> annulerMonRendezVous(
            @PathVariable String id, Authentication authentication) {
        var response = service.annulerRendezVousPatient(id, authentication.getName());
        auditService.record(authentication.getName(), "CANCEL_OWN", "RENDEZ_VOUS", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/admin/{id}/terminer")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<RendezVousResponse> terminer(@PathVariable String id, Authentication authentication) {
        var response = service.terminerRendezVous(id);
        auditService.record(authentication.getName(), "COMPLETE", "RENDEZ_VOUS", id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable String id, Authentication authentication) {
        service.supprimerRendezVous(id);
        auditService.record(authentication.getName(), "DELETE", "RENDEZ_VOUS", id);
        return ResponseEntity.noContent().build();
    }
}
