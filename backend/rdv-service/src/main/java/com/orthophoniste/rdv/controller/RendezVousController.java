package com.orthophoniste.rdv.controller;

import com.orthophoniste.rdv.dto.*;
import com.orthophoniste.rdv.model.RendezVousStatus;
import com.orthophoniste.rdv.service.RendezVousService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rdv")
@RequiredArgsConstructor
public class RendezVousController {

    private final RendezVousService service;

    // ── PUBLIC ──────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<RendezVousResponse> creer(
            @Valid @RequestBody RendezVousRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.creerRendezVous(request));
    }

    // ── ADMIN ────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<RendezVousResponse>> listerTous() {
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
            @Valid @RequestBody ConfirmRequest request) {
        return ResponseEntity.ok(service.confirmerRendezVous(id, request));
    }

    @PutMapping("/admin/{id}/annuler")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<RendezVousResponse> annuler(@PathVariable String id) {
        return ResponseEntity.ok(service.annulerRendezVous(id));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        service.supprimerRendezVous(id);
        return ResponseEntity.noContent().build();
    }
}