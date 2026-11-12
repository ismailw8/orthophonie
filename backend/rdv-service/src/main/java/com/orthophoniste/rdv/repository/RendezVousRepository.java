package com.orthophoniste.rdv.repository;

import com.orthophoniste.rdv.model.RendezVous;
import com.orthophoniste.rdv.model.RendezVousStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface RendezVousRepository
        extends MongoRepository<RendezVous, String> {

    List<RendezVous> findByStatus(
            RendezVousStatus status
    );

    List<RendezVous> findByEmail(
            String email
    );

    List<RendezVous> findAllByOrderByCreatedAtDesc();

    /*
     * Retourne les rendez-vous actifs d'une date.
     */
    List<RendezVous> findByDateSouhaiteeAndStatusIn(
            LocalDate dateSouhaitee,
            List<RendezVousStatus> status
    );

    /*
     * Vérifie rapidement si un créneau est déjà occupé.
     */
    boolean existsByActiveSlotKey(
            String activeSlotKey
    );

    List<RendezVous> findByDateSouhaiteeBetweenAndStatusIn(
            LocalDate dateDebut,
            LocalDate dateFin,
            List<RendezVousStatus> statuses
    );
}
