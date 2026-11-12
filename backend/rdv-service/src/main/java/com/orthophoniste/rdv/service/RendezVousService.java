package com.orthophoniste.rdv.service;

import com.orthophoniste.rdv.client.NotificationClient;
import com.orthophoniste.rdv.client.SuiviClient;
import com.orthophoniste.rdv.dto.*;
import com.orthophoniste.rdv.exception.CreneauIndisponibleException;
import com.orthophoniste.rdv.model.RendezVous;
import com.orthophoniste.rdv.model.RendezVousStatus;
import com.orthophoniste.rdv.repository.RendezVousRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Comparator;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class RendezVousService {

    private final RendezVousRepository repository;

    private final NotificationClient notificationClient;
    private final IndisponibiliteService indisponibiliteService;
    private final SuiviClient suiviClient;

    @Value("${cabinet.hours.open:09:00}")
    private LocalTime heureOuverture = LocalTime.of(9, 0);
    @Value("${cabinet.hours.close:17:00}")
    private LocalTime heureFermeture = LocalTime.of(17, 0);
    @Value("${cabinet.slot-minutes:15}")
    private int slotMinutes = 15;
    @Value("${cabinet.max-booking-days:180}")
    private int maxBookingDays = 180;

    /*
     * Ces deux statuts bloquent un créneau.
     */
    private static final List<RendezVousStatus> STATUTS_OCCUPANTS =
            List.of(
                    RendezVousStatus.EN_ATTENTE,
                    RendezVousStatus.CONFIRME
            );

    // =========================================================
    // PUBLIC
    // =========================================================

    public RendezVousResponse creerRendezVous(
            RendezVousRequest request
    ) {

        validerCreneau(request.getDateSouhaitee(), request.getHeureSouhaitee());

        String activeSlotKey = construireCleCreneau(
                request.getDateSouhaitee(),
                request.getHeureSouhaitee()
        );

        /*
         * Première sécurité :
         * vérification avant l'enregistrement.
         */
        if (
                repository.existsByActiveSlotKey(
                        activeSlotKey
                )
        ) {

            throw new CreneauIndisponibleException(
                    "Ce créneau est déjà réservé. "
                            + "Veuillez choisir un autre horaire."
            );
        }

        var rdv = RendezVous.builder()

                .firstName(
                        request.getFirstName()
                )

                .lastName(
                        request.getLastName()
                )

                .phone(
                        request.getPhone()
                )

                .email(
                        request.getEmail()
                )

                .dateSouhaitee(
                        request.getDateSouhaitee()
                )

                .heureSouhaitee(
                        request.getHeureSouhaitee()
                )

                .activeSlotKey(
                        activeSlotKey
                )

                .motif(
                        request.getMotif()
                )

                .status(
                        RendezVousStatus.EN_ATTENTE
                )

                .createdAt(
                        LocalDateTime.now()
                )

                .updatedAt(
                        LocalDateTime.now()
                )

                .build();

        try {

            /*
             * Deuxième sécurité.
             *
             * Très importante si deux patients
             * cliquent pratiquement au même moment.
             */
            rdv = repository.save(rdv);

        } catch (DuplicateKeyException exception) {

            throw new CreneauIndisponibleException(
                    "Ce créneau vient d'être réservé "
                            + "par un autre patient. "
                            + "Veuillez choisir un autre horaire."
            );
        }

        envoyerNotification(
                request.getPhone(),
                String.format(
                        "Bonjour %s, votre demande de rendez-vous "
                                + "du %s à %s a bien été reçue. "
                                + "Nous vous contacterons sous 24h "
                                + "pour confirmation.",
                        request.getFirstName(),
                        request.getDateSouhaitee(),
                        request.getHeureSouhaitee()
                )
        );

        log.info(
                "Nouveau RDV créé : {} {} - {} à {}",
                request.getFirstName(),
                request.getLastName(),
                request.getDateSouhaitee(),
                request.getHeureSouhaitee()
        );

        return toResponse(rdv);
    }

    /*
     * Endpoint utilisé par React.
     *
     * Exemple :
     * date = 2026-08-06
     *
     * résultat :
     * ["09:00", "09:15", "11:30"]
     */
    public List<String> listerCreneauxOccupes(
            LocalDate date
    ) {

        return repository
                .findByDateSouhaiteeAndStatusIn(
                        date,
                        STATUTS_OCCUPANTS
                )
                .stream()
                .map(
                        RendezVous::getHeureSouhaitee
                )
                .filter(
                        heure -> heure != null
                                && !heure.isBlank()
                )
                .distinct()
                .sorted()
                .toList();
    }

    // =========================================================
    // ADMIN
    // =========================================================

    public List<RendezVousResponse> listerTous() {

        return repository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RendezVousResponse> listerParStatus(
            RendezVousStatus status
    ) {

        return repository
                .findByStatus(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RendezVousResponse confirmerRendezVous(
            String id,
            ConfirmRequest request
    ) {

        var rdv = repository
                .findById(id)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "RDV introuvable : " + id
                        )
                );

        if (rdv.getStatus() != RendezVousStatus.EN_ATTENTE) {
            throw new IllegalArgumentException("Seul un rendez-vous en attente peut être confirmé");
        }

        LocalDate nouvelleDate = request.getDateConfirmee().toLocalDate();
        String nouvelleHeure = request.getDateConfirmee().toLocalTime().toString();
        validerCreneau(nouvelleDate, nouvelleHeure);

        String nouvelleCle = construireCleCreneau(nouvelleDate, nouvelleHeure);
        if (!nouvelleCle.equals(rdv.getActiveSlotKey())
                && repository.existsByActiveSlotKey(nouvelleCle)) {
            throw new CreneauIndisponibleException("Le créneau de confirmation est déjà réservé");
        }

        rdv.setStatus(
                RendezVousStatus.CONFIRME
        );

        rdv.setDateConfirmee(
                request.getDateConfirmee()
        );

        rdv.setDateSouhaitee(nouvelleDate);
        rdv.setHeureSouhaitee(nouvelleHeure);
        rdv.setActiveSlotKey(nouvelleCle);

        rdv.setNotes(
                request.getNotes()
        );

        rdv.setUpdatedAt(
                LocalDateTime.now()
        );

        try {
            repository.save(rdv);
        } catch (DuplicateKeyException exception) {
            throw new CreneauIndisponibleException("Le créneau de confirmation vient d’être réservé");
        }

        envoyerNotification(
                rdv.getPhone(),
                String.format(
                        "Bonjour %s, votre rendez-vous "
                                + "du %s à %s est confirmé. "
                                + "Cabinet OrthoConnect.",
                        rdv.getFirstName(),
                        rdv.getDateSouhaitee(),
                        rdv.getHeureSouhaitee()
                )
        );

        return toResponse(rdv);
    }

    public RendezVousResponse annulerRendezVous(
            String id
    ) {

        var rdv = repository
                .findById(id)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "RDV introuvable : " + id
                        )
                );

        if (rdv.getStatus() == RendezVousStatus.ANNULE) {
            throw new IllegalArgumentException("Ce rendez-vous est déjà annulé");
        }

        if (rdv.getStatus() == RendezVousStatus.TERMINE) {
            throw new IllegalArgumentException("Un rendez-vous terminé ne peut pas être annulé");
        }

        rdv.setStatus(
                RendezVousStatus.ANNULE
        );

        /*
         * IMPORTANT :
         * la clé est supprimée pour permettre à
         * un autre patient de reprendre le créneau.
         */
        rdv.setActiveSlotKey(null);

        rdv.setUpdatedAt(
                LocalDateTime.now()
        );

        repository.save(rdv);

        envoyerNotification(
                rdv.getPhone(),
                String.format(
                        "Bonjour %s, votre rendez-vous "
                                + "du %s à %s a été annulé. "
                                + "Le créneau est de nouveau disponible.",
                        rdv.getFirstName(),
                        rdv.getDateSouhaitee(),
                        rdv.getHeureSouhaitee()
                )
        );

        return toResponse(rdv);
    }

    public void supprimerRendezVous(
            String id
    ) {

        if (!repository.existsById(id)) {

            throw new IllegalArgumentException(
                    "RDV introuvable : " + id
            );
        }

        repository.deleteById(id);
    }

    public List<RendezVousResponse> listerMesRendezVous(String email) {
        return repository.findByEmail(email.trim().toLowerCase()).stream()
                .sorted(Comparator.comparing(
                        RendezVous::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    public RendezVousResponse annulerRendezVousPatient(String id, String email) {
        var rendezVous = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RDV introuvable : " + id));
        if (!rendezVous.getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("RDV introuvable : " + id);
        }
        return annulerRendezVous(id);
    }

    public RendezVousResponse terminerRendezVous(String id) {
        var rdv = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RDV introuvable : " + id));
        if (rdv.getStatus() != RendezVousStatus.CONFIRME) {
            throw new IllegalArgumentException("Seul un rendez-vous confirmé peut être terminé");
        }
        rdv.setStatus(RendezVousStatus.TERMINE);
        rdv.setActiveSlotKey(null);
        rdv.setUpdatedAt(LocalDateTime.now());
        return toResponse(repository.save(rdv));
    }

    // =========================================================
    // PRIVATE
    // =========================================================

    private String construireCleCreneau(
            LocalDate date,
            String heure
    ) {

        return date + "#" + heure;
    }

    private void validerCreneau(LocalDate date, String heure) {
        if (date.isAfter(LocalDate.now().plusDays(maxBookingDays))) {
            throw new CreneauIndisponibleException("La date demandée est trop éloignée");
        }
        LocalTime horaire;
        try {
            horaire = LocalTime.parse(heure);
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Horaire invalide");
        }

        if (date.getDayOfWeek() == DayOfWeek.SATURDAY
                || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new CreneauIndisponibleException("Le cabinet est fermé le week-end");
        }

        if (horaire.isBefore(heureOuverture) || horaire.isAfter(heureFermeture)
                || horaire.getMinute() % slotMinutes != 0 || horaire.getSecond() != 0) {
            throw new IllegalArgumentException("Le créneau demandé ne respecte pas les horaires du cabinet");
        }

        LocalDateTime dateHeure = LocalDateTime.of(date, horaire);
        if (!dateHeure.isAfter(LocalDateTime.now())) {
            throw new CreneauIndisponibleException("Ce créneau est déjà passé");
        }

        if (indisponibiliteService.isDateBloquee(date)) {
            throw new CreneauIndisponibleException("Le cabinet est indisponible à cette date");
        }

        verifierSeancesPlanifiees(date, horaire);
    }

    private void verifierSeancesPlanifiees(LocalDate date, LocalTime horaire) {
        if (suiviClient.occupiedSlots(date.toString()).stream()
                .map(value -> value.length() >= 5 ? value.substring(0, 5) : value)
                .anyMatch(horaire.toString()::equals)) {
            throw new CreneauIndisponibleException("Ce créneau est déjà réservé pour une séance");
        }
    }

    private void envoyerNotification(
            String phone,
            String message
    ) {

        CompletableFuture.runAsync(() -> {
        try {

            notificationClient.sendNotification(
                    NotificationRequest
                            .builder()
                            .phone(phone)
                            .message(message)
                            .channel("WHATSAPP")
                            .build()
            );

        } catch (Exception exception) {

            log.warn(
                    "Notification non envoyée pour {} : {}",
                    phone,
                    exception.getMessage()
            );
        }
        });
    }

    private RendezVousResponse toResponse(
            RendezVous rdv
    ) {

        return RendezVousResponse
                .builder()

                .id(
                        rdv.getId()
                )

                .firstName(
                        rdv.getFirstName()
                )

                .lastName(
                        rdv.getLastName()
                )

                .phone(
                        rdv.getPhone()
                )

                .email(
                        rdv.getEmail()
                )

                .dateSouhaitee(
                        rdv.getDateSouhaitee()
                )

                .heureSouhaitee(
                        rdv.getHeureSouhaitee()
                )

                .motif(
                        rdv.getMotif()
                )

                .status(
                        rdv.getStatus()
                )

                .dateConfirmee(
                        rdv.getDateConfirmee()
                )

                .notes(
                        rdv.getNotes()
                )

                .createdAt(
                        rdv.getCreatedAt()
                )

                .build();
    }
}
