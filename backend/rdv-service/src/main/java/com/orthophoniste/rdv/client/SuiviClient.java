package com.orthophoniste.rdv.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@FeignClient(name = "suivi-availability", url = "${clients.suivi.url:http://localhost:8083}")
public interface SuiviClient {
    @GetMapping("/api/suivi/creneaux-occupes")
    List<String> occupiedSlots(@RequestParam("date") String date);
}
