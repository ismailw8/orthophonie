package com.orthophoniste.rdv.repository;

import com.orthophoniste.rdv.model.AuditEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AuditEventRepository extends MongoRepository<AuditEvent, String> {}
