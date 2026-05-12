package com.orthophoniste.suivi.repository;

import com.orthophoniste.suivi.model.Bilan;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BilanRepository extends MongoRepository<Bilan, String> {
    Optional<Bilan> findByPatientId(String patientId);
    Optional<Bilan> findByPatientEmail(String email);
    List<Bilan> findAllByOrderByUpdatedAtDesc();
}