package com.orthophoniste.rdv.service;

import com.orthophoniste.rdv.model.AuditEvent;
import com.orthophoniste.rdv.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditEventRepository repository;

    public void record(String actor, String action, String type, String id) {
        repository.save(AuditEvent.builder()
                .actor(actor == null ? "PUBLIC" : actor).action(action)
                .resourceType(type).resourceId(id).occurredAt(LocalDateTime.now()).build());
    }
}
