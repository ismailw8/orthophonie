package com.orthophoniste.rdv.repository;

import com.orthophoniste.rdv.model.RendezVous;
import com.orthophoniste.rdv.model.RendezVousStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RendezVousRepository extends MongoRepository<RendezVous, String> {
    List<RendezVous> findByStatus(RendezVousStatus status);
    List<RendezVous> findByEmail(String email);
    List<RendezVous> findAllByOrderByCreatedAtDesc();
}