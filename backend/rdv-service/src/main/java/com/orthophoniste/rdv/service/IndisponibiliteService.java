package com.orthophoniste.rdv.service;

import com.orthophoniste.rdv.dto.IndisponibiliteRequest;
import com.orthophoniste.rdv.dto.IndisponibiliteResponse;
import com.orthophoniste.rdv.model.Indisponibilite;
import com.orthophoniste.rdv.repository.IndisponibiliteRepository;
import com.orthophoniste.rdv.repository.RendezVousRepository;
import com.orthophoniste.rdv.model.RendezVousStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndisponibiliteService {

    private final IndisponibiliteRepository repository;
    private final RendezVousRepository rendezVousRepository;

    // ── PUBLIC ──────────────────────────────────────────────

    // Retourne toutes les dates bloquées (pour le formulaire RDV)
    public List<IndisponibiliteResponse> listerFutures() {
        return repository
                .findByDateFinGreaterThanEqualOrderByDateDebutAsc(
                        LocalDate.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Vérifie si une date est bloquée
    public boolean isDateBloquee(LocalDate date) {
        return !repository.findByDateInRange(date).isEmpty();
    }

    // ── ADMIN ────────────────────────────────────────────────

    public IndisponibiliteResponse creer(IndisponibiliteRequest request) {
        if (request.getDateFin().isBefore(request.getDateDebut())) {
            throw new IllegalArgumentException(
                    "La date de fin doit être après la date de début");
        }
        if (request.getDateDebut().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La date de début ne peut pas être dans le passé");
        }

        if (!repository.findOverlapping(request.getDateDebut(), request.getDateFin()).isEmpty()) {
            throw new IllegalArgumentException("Cette période chevauche une indisponibilité existante");
        }

        var statutsActifs = List.of(RendezVousStatus.EN_ATTENTE, RendezVousStatus.CONFIRME);
        if (!rendezVousRepository.findByDateSouhaiteeBetweenAndStatusIn(
                request.getDateDebut(), request.getDateFin(), statutsActifs).isEmpty()) {
            throw new IllegalArgumentException(
                    "Des rendez-vous actifs existent sur cette période ; annulez ou déplacez-les d’abord");
        }

        var indispo = Indisponibilite.builder()
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .motif(request.getMotif())
                .createdAt(LocalDateTime.now())
                .build();

        repository.save(indispo);
        log.info("Indisponibilité créée : {} → {} ({})",
                request.getDateDebut(), request.getDateFin(), request.getMotif());

        return toResponse(indispo);
    }

    public List<IndisponibiliteResponse> listerToutes() {
        return repository
                .findByDateFinGreaterThanEqualOrderByDateDebutAsc(
                        LocalDate.now().minusMonths(1))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void supprimer(String id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Indisponibilité introuvable : " + id);
        }
        repository.deleteById(id);
        log.info("Indisponibilité supprimée : {}", id);
    }

    // ── MAPPER ───────────────────────────────────────────────

    private IndisponibiliteResponse toResponse(Indisponibilite i) {
        return IndisponibiliteResponse.builder()
                .id(i.getId())
                .dateDebut(i.getDateDebut())
                .dateFin(i.getDateFin())
                .motif(i.getMotif())
                .createdAt(i.getCreatedAt())
                .build();
    }
}
