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

@Service
@RequiredArgsConstructor
@Slf4j
public class SuiviService {

    private final BilanRepository bilanRepository;
    private final SeanceRepository seanceRepository;

    // ── PATIENT (lecture seule) ──────────────────────────────

    public DashboardResponse getDashboard(String email) {
        var bilan = bilanRepository.findByPatientEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Aucun bilan trouvé pour : " + email));

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

        bilan.setPatientEmail(request.getPatientEmail());
        bilan.setPatientNom(request.getPatientNom());
        bilan.setSeancesEffectuees(request.getSeancesEffectuees());
        bilan.setSeancesPrevues(request.getSeancesPrevues());
        bilan.setProgressionGlobale(request.getProgressionGlobale());
        bilan.setAxes(request.getAxes());
        bilan.setRemarques(request.getRemarques());
        bilan.setUpdatedAt(LocalDateTime.now());

        bilanRepository.save(bilan);
        log.info("Bilan mis à jour pour : {}", request.getPatientEmail());
        return toBilanResponse(bilan);
    }

    public SeanceResponse ajouterSeance(SeanceRequest request) {
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
        return toSeanceResponse(seance);
    }

    public List<SeanceResponse> listerSeancesPatient(String patientId) {
        return seanceRepository
                .findByPatientIdOrderByDateSeanceAsc(patientId)
                .stream().map(this::toSeanceResponse).toList();
    }

    public void supprimerSeance(String seanceId) {
        if (!seanceRepository.existsById(seanceId)) {
            throw new IllegalArgumentException("Séance introuvable : " + seanceId);
        }
        seanceRepository.deleteById(seanceId);
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