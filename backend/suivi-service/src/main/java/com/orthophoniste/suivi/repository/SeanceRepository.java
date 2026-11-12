package com.orthophoniste.suivi.repository;

import com.orthophoniste.suivi.model.Seance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SeanceRepository extends MongoRepository<Seance, String> {
    List<Seance> findAllByOrderByDateSeanceAsc();
    List<Seance> findByPatientIdOrderByDateSeanceAsc(String patientId);
    List<Seance> findByPatientEmailOrderByDateSeanceAsc(String email);
    List<Seance> findByPatientIdAndEffectueeOrderByDateSeanceAsc(
            String patientId, boolean effectuee);
    long countByPatientId(String patientId);
    long countByPatientIdAndEffectuee(String patientId, boolean effectuee);
}
