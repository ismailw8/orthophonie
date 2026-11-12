package com.orthophoniste.rdv.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@Document("audit_events")
public class AuditEvent {
    @Id private String id;
    @Indexed private String actor;
    @Indexed private String action;
    private String resourceType;
    private String resourceId;
    @Indexed(expireAfter = "P730D") private LocalDateTime occurredAt;
}
