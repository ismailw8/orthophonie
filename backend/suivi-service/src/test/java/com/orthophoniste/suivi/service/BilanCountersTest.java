package com.orthophoniste.suivi.service;

import com.orthophoniste.suivi.dto.BilanRequest;
import com.orthophoniste.suivi.model.Bilan;
import com.orthophoniste.suivi.repository.BilanRepository;
import com.orthophoniste.suivi.repository.SeanceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BilanCountersTest {
    @Mock private BilanRepository bilans;
    @Mock private SeanceRepository sessions;
    @InjectMocks private SuiviService service;

    private BilanRequest request() {
        var request = new BilanRequest();
        request.setPatientId("patient-1");
        request.setPatientEmail("patient@example.com");
        request.setPatientNom("Patient Test");
        request.setSeancesEffectuees(99);
        request.setSeancesPrevues(100);
        return request;
    }

    @Test void savingABilanCannotOverwriteSessionCountsWithStaleClientValues() {
        when(bilans.findByPatientId("patient-1")).thenReturn(Optional.of(Bilan.builder().patientId("patient-1").build()));
        when(sessions.countByPatientId("patient-1")).thenReturn(4L);
        when(sessions.countByPatientIdAndEffectuee("patient-1", true)).thenReturn(2L);
        var response = service.creerOuMettreAJourBilan(request());
        assertEquals(4, response.getSeancesPrevues());
        assertEquals(2, response.getSeancesEffectuees());
    }

    @Test void aNewBilanWithoutSessionsStartsWithZeroCounts() {
        when(bilans.findByPatientId("patient-1")).thenReturn(Optional.empty());
        var response = service.creerOuMettreAJourBilan(request());
        assertEquals(0, response.getSeancesPrevues());
        assertEquals(0, response.getSeancesEffectuees());
    }
}
