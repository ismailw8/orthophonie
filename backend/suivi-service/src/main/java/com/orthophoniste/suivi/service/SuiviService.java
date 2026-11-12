package com.orthophoniste.suivi.service;

import com.orthophoniste.suivi.dto.*;
import com.orthophoniste.suivi.model.Bilan;
import com.orthophoniste.suivi.model.Seance;
import com.orthophoniste.suivi.repository.BilanRepository;
import com.orthophoniste.suivi.repository.SeanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuiviService {

    private final BilanRepository bilanRepository;
    private final SeanceRepository seanceRepository;

    // ── PATIENT (lecture seule) ──────────────────────────────

    public DashboardResponse getDashboard(String email) {

        var bilanOpt = bilanRepository.findByPatientEmail(email);

        // Pas encore de bilan → dashboard vide
        if (bilanOpt.isEmpty()) {
            return DashboardResponse.builder()
                    .seancesEffectuees(0)
                    .seancesPrevues(0)
                    .progressionGlobale(0)
                    .bilan(null)
                    .prochainesSeances(List.of())
                    .seancesPassees(List.of())
                    .build();
        }

        var bilan = bilanOpt.get();

        var toutes = seanceRepository
                .findByPatientEmailOrderByDateSeanceAsc(email);

        var prochaines = toutes.stream()
                .filter(s -> !s.isEffectuee())
                .map(this::toSeanceResponse)
                .toList();

        var passees = toutes.stream()
                .filter(Seance::isEffectuee)
                .map(this::toSeanceResponse)
                .toList();

        return DashboardResponse.builder()
                .seancesEffectuees(bilan.getSeancesEffectuees())
                .seancesPrevues(bilan.getSeancesPrevues())
                .progressionGlobale(bilan.getProgressionGlobale())
                .bilan(toBilanResponse(bilan))
                .prochainesSeances(prochaines)
                .seancesPassees(passees)
                .build();
    }

    // ── ADMIN (lecture + écriture) ───────────────────────────

    public List<BilanResponse> listerBilans() {
        return bilanRepository.findAllByOrderByUpdatedAtDesc()
                .stream().map(this::toBilanResponse).toList();
    }

    public BilanResponse creerOuMettreAJourBilan(BilanRequest request) {
        var bilan = bilanRepository
                .findByPatientId(request.getPatientId())
                .orElse(Bilan.builder()
                        .patientId(request.getPatientId())
                        .createdAt(LocalDateTime.now())
                        .build());

        bilan.setPatientEmail(request.getPatientEmail().trim().toLowerCase());
        bilan.setPatientNom(request.getPatientNom().trim());
        // Counts come from persisted sessions, including when saving the bilan.
        bilan.setSeancesEffectuees(Math.toIntExact(
                seanceRepository.countByPatientIdAndEffectuee(request.getPatientId(), true)));
        bilan.setSeancesPrevues(Math.toIntExact(
                seanceRepository.countByPatientId(request.getPatientId())));
        bilan.setProgressionGlobale(request.getProgressionGlobale());
        bilan.setAxes(request.getAxes() == null ? List.of() : request.getAxes());
        bilan.setRemarques(request.getRemarques() == null ? "" : request.getRemarques().trim());
        bilan.setUpdatedAt(LocalDateTime.now());

        bilanRepository.save(bilan);
        log.info("Bilan mis à jour pour : {}", request.getPatientEmail());
        return toBilanResponse(bilan);
    }

    public SeanceResponse ajouterSeance(SeanceRequest request) {
        if (seanceRepository.findAll().stream().anyMatch(seance -> !seance.isEffectuee()
                && request.getDateSeance().equals(seance.getDateSeance()))) {
            throw new IllegalArgumentException("Ce créneau est déjà occupé par une séance");
        }
        var seance = Seance.builder()
                .patientId(request.getPatientId())
                .patientEmail(request.getPatientEmail())
                .titre(request.getTitre())
                .description(request.getDescription())
                .dateSeance(request.getDateSeance())
                .effectuee(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        seanceRepository.save(seance);
        synchroniserCompteurs(request.getPatientId());
        log.info("Séance ajoutée : {} pour {}", request.getTitre(), request.getPatientEmail());
        return toSeanceResponse(seance);
    }

    public SeanceResponse marquerSeanceEffectuee(String seanceId) {
        var seance = seanceRepository.findById(seanceId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Séance introuvable : " + seanceId));

        seance.setEffectuee(true);
        seance.setUpdatedAt(LocalDateTime.now());
        seanceRepository.save(seance);
        synchroniserCompteurs(seance.getPatientId());
        return toSeanceResponse(seance);
    }

    public List<SeanceResponse> listerSeances() {
        return seanceRepository.findAllByOrderByDateSeanceAsc()
                .stream().map(this::toSeanceResponse).toList();
    }

    public List<SeanceResponse> listerSeancesPatient(String patientId) {
        return seanceRepository
                .findByPatientIdOrderByDateSeanceAsc(patientId)
                .stream().map(this::toSeanceResponse).toList();
    }

    public void supprimerSeance(String seanceId) {
        var seance = seanceRepository.findById(seanceId)
                .orElseThrow(() -> new IllegalArgumentException("Séance introuvable : " + seanceId));
        seanceRepository.deleteById(seanceId);
        synchroniserCompteurs(seance.getPatientId());
    }

    public List<String> listerCreneauxOccupes(LocalDate date) {
        return seanceRepository.findAll().stream()
                .filter(seance -> !seance.isEffectuee() && seance.getDateSeance() != null
                        && seance.getDateSeance().toLocalDate().equals(date))
                .map(seance -> seance.getDateSeance().toLocalTime().toString())
                .distinct().sorted().toList();
    }

    private void synchroniserCompteurs(String patientId) {
        bilanRepository.findByPatientId(patientId).ifPresent(bilan -> {
            bilan.setSeancesPrevues(Math.toIntExact(seanceRepository.countByPatientId(patientId)));
            bilan.setSeancesEffectuees(Math.toIntExact(
                    seanceRepository.countByPatientIdAndEffectuee(patientId, true)));
            bilan.setUpdatedAt(LocalDateTime.now());
            bilanRepository.save(bilan);
        });
    }

    // ── MAPPERS ──────────────────────────────────────────────

    private SeanceResponse toSeanceResponse(Seance s) {
        return SeanceResponse.builder()
                .id(s.getId())
                .patientId(s.getPatientId())
                .patientEmail(s.getPatientEmail())
                .titre(s.getTitre())
                .description(s.getDescription())
                .dateSeance(s.getDateSeance())
                .effectuee(s.isEffectuee())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private BilanResponse toBilanResponse(Bilan b) {
        return BilanResponse.builder()
                .id(b.getId())
                .patientId(b.getPatientId())
                .patientEmail(b.getPatientEmail())
                .patientNom(b.getPatientNom())
                .seancesEffectuees(b.getSeancesEffectuees())
                .seancesPrevues(b.getSeancesPrevues())
                .progressionGlobale(b.getProgressionGlobale())
                .axes(b.getAxes())
                .remarques(b.getRemarques())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
