package com.orthophoniste.rdv.repository;

import com.orthophoniste.rdv.model.Indisponibilite;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface IndisponibiliteRepository
        extends MongoRepository<Indisponibilite, String> {

    // Récupère toutes les indisponibilités futures
    List<Indisponibilite> findByDateFinGreaterThanEqualOrderByDateDebutAsc(
            LocalDate date);

    // Vérifie si une date est dans une période bloquée
    @Query("{ 'dateDebut': { $lte: ?0 }, 'dateFin': { $gte: ?0 } }")
    List<Indisponibilite> findByDateInRange(LocalDate date);

    @Query("{ 'dateDebut': { $lte: ?1 }, 'dateFin': { $gte: ?0 } }")
    List<Indisponibilite> findOverlapping(LocalDate dateDebut, LocalDate dateFin);
}
