package com.orthophoniste.rdv.controller;

import com.orthophoniste.rdv.dto.IndisponibiliteRequest;
import com.orthophoniste.rdv.dto.IndisponibiliteResponse;
import com.orthophoniste.rdv.service.IndisponibiliteService;
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
public class IndisponibiliteController {

    private final IndisponibiliteService service;

    // ── PUBLIC — utilisé par le formulaire RDV ────────────────
    @GetMapping("/indisponibilites")
    public ResponseEntity<List<IndisponibiliteResponse>> listerPublic() {
        return ResponseEntity.ok(service.listerFutures());
    }

    // ── ADMIN ─────────────────────────────────────────────────
    @GetMapping("/admin/indisponibilites")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<IndisponibiliteResponse>> listerToutes() {
        return ResponseEntity.ok(service.listerToutes());
    }

    @PostMapping("/admin/indisponibilites")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<IndisponibiliteResponse> creer(
            @Valid @RequestBody IndisponibiliteRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.creer(request));
    }

    @DeleteMapping("/admin/indisponibilites/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        service.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}