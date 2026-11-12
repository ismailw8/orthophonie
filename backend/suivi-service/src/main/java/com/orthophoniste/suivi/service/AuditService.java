package com.orthophoniste.suivi.service;

import com.orthophoniste.suivi.model.AuditEvent;
import com.orthophoniste.suivi.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditEventRepository repository;
    public void record(String actor, String action, String type, String id) {
        repository.save(AuditEvent.builder().actor(actor).action(action)
                .resourceType(type).resourceId(id).occurredAt(LocalDateTime.now()).build());
    }
}
