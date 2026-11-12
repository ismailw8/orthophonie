package com.orthophoniste.suivi.repository;

import com.orthophoniste.suivi.model.AuditEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AuditEventRepository extends MongoRepository<AuditEvent, String> {}
