package com.orthophoniste.rdv.service;

import com.orthophoniste.rdv.client.NotificationClient;
import com.orthophoniste.rdv.dto.*;
import com.orthophoniste.rdv.model.RendezVous;
import com.orthophoniste.rdv.model.RendezVousStatus;
import com.orthophoniste.rdv.repository.RendezVousRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RendezVousService {

    private final RendezVousRepository repository;
    private final NotificationClient notificationClient;

    // ── PUBLIC ──────────────────────────────────────────────

    public RendezVousResponse creerRendezVous(RendezVousRequest request) {
        var rdv = RendezVous.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .dateSouhaitee(request.getDateSouhaitee())
                .motif(request.getMotif())
                .status(RendezVousStatus.EN_ATTENTE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        repository.save(rdv);

        // Notifier le patient via SMS/WhatsApp
        envoyerNotification(
                request.getPhone(),
                String.format(
                        "Bonjour %s, votre demande de rendez-vous du %s a bien été reçue. " +
                                "Nous vous contacterons sous 24h pour confirmation.",
                        request.getFirstName(),
                        request.getDateSouhaitee()
                )
        );

        log.info("Nouveau RDV créé : {} {}", request.getFirstName(), request.getLastName());
        return toResponse(rdv);
    }

    // ── ADMIN ────────────────────────────────────────────────

    public List<RendezVousResponse> listerTous() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public List<RendezVousResponse> listerParStatus(RendezVousStatus status) {
        return repository.findByStatus(status)
                .stream().map(this::toResponse).toList();
    }

    public RendezVousResponse confirmerRendezVous(String id, ConfirmRequest request) {
        var rdv = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RDV introuvable : " + id));

        rdv.setStatus(RendezVousStatus.CONFIRME);
        rdv.setDateConfirmee(request.getDateConfirmee());
        rdv.setNotes(request.getNotes());
        rdv.setUpdatedAt(LocalDateTime.now());
        repository.save(rdv);

        envoyerNotification(
                rdv.getPhone(),
                String.format(
                        "Bonjour %s, votre rendez-vous est confirmé le %s. " +
                                "Cabinet Dr. Berrada — à bientôt !",
                        rdv.getFirstName(),
                        request.getDateConfirmee()
                )
        );

        return toResponse(rdv);
    }

    public RendezVousResponse annulerRendezVous(String id) {
        var rdv = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RDV introuvable : " + id));

        rdv.setStatus(RendezVousStatus.ANNULE);
        rdv.setUpdatedAt(LocalDateTime.now());
        repository.save(rdv);

        envoyerNotification(
                rdv.getPhone(),
                String.format(
                        "Bonjour %s, votre rendez-vous du %s a été annulé. " +
                                "Contactez-nous pour replanifier.",
                        rdv.getFirstName(),
                        rdv.getDateSouhaitee()
                )
        );

        return toResponse(rdv);
    }

    public void supprimerRendezVous(String id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("RDV introuvable : " + id);
        }
        repository.deleteById(id);
    }

    // ── PRIVATE ──────────────────────────────────────────────

    private void envoyerNotification(String phone, String message) {
        try {
            notificationClient.sendNotification(
                    NotificationRequest.builder()
                            .phone(phone)
                            .message(message)
                            .channel("WHATSAPP")
                            .build()
            );
        } catch (Exception e) {
            log.warn("Notification non envoyée pour {} : {}", phone, e.getMessage());
        }
    }

    private RendezVousResponse toResponse(RendezVous rdv) {
        return RendezVousResponse.builder()
                .id(rdv.getId())
                .firstName(rdv.getFirstName())
                .lastName(rdv.getLastName())
                .phone(rdv.getPhone())
                .email(rdv.getEmail())
                .dateSouhaitee(rdv.getDateSouhaitee())
                .motif(rdv.getMotif())
                .status(rdv.getStatus())
                .dateConfirmee(rdv.getDateConfirmee())
                .notes(rdv.getNotes())
                .createdAt(rdv.getCreatedAt())
                .build();
    }
}