package com.orthophoniste.rdv.service;

import com.orthophoniste.rdv.client.NotificationClient;
import com.orthophoniste.rdv.client.SuiviClient;
import com.orthophoniste.rdv.dto.RendezVousRequest;
import com.orthophoniste.rdv.exception.CreneauIndisponibleException;
import com.orthophoniste.rdv.repository.RendezVousRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;

class RendezVousServiceTest {
    private IndisponibiliteService indisponibiliteService;
    private RendezVousService service;
    private SuiviClient suiviClient;
    private RendezVousRepository repository;

    @BeforeEach
    void setUp() {
        repository = mock(RendezVousRepository.class);
        NotificationClient notificationClient = mock(NotificationClient.class);
        indisponibiliteService = mock(IndisponibiliteService.class);
        suiviClient = mock(SuiviClient.class);
        service = new RendezVousService(repository, notificationClient, indisponibiliteService, suiviClient);
    }

    @Test
    void refuseUnRendezVousLeWeekend() {
        LocalDate saturday = LocalDate.now().plusDays(1);
        while (saturday.getDayOfWeek() != DayOfWeek.SATURDAY) {
            saturday = saturday.plusDays(1);
        }

        RendezVousRequest request = validRequest(saturday);
        assertThrows(CreneauIndisponibleException.class, () -> service.creerRendezVous(request));
    }

    @Test
    void refuseUneDateDeclareeIndisponible() {
        LocalDate date = nextWeekday();
        when(indisponibiliteService.isDateBloquee(date)).thenReturn(true);

        assertThrows(CreneauIndisponibleException.class,
                () -> service.creerRendezVous(validRequest(date)));
    }

    private RendezVousRequest validRequest(LocalDate date) {
        RendezVousRequest request = new RendezVousRequest();
        request.setFirstName("Jean");
        request.setLastName("Patient");
        request.setPhone("+33600000000");
        request.setEmail("jean@example.test");
        request.setDateSouhaitee(date);
        request.setHeureSouhaitee("10:00");
        return request;
    }

    @Test
    void refuseUnCreneauOccupeDansSuiviAvantToutEnregistrement() {
        LocalDate date = nextWeekday();
        when(suiviClient.occupiedSlots(date.toString())).thenReturn(List.of("10:00:00"));

        assertThrows(CreneauIndisponibleException.class,
                () -> service.creerRendezVous(validRequest(date)));
        verifyNoInteractions(repository);
    }

    private LocalDate nextWeekday() {
        LocalDate date = LocalDate.now().plusDays(1);
        while (date.getDayOfWeek() == DayOfWeek.SATURDAY
                || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            date = date.plusDays(1);
        }
        return date;
    }
}
