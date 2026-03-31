package dev.zeroday.health.therapeutics.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "therapeutic_log")
@Getter
@Setter
@NoArgsConstructor
public class TherapeuticLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "therapeutic_type", nullable = false, length = 50)
    private String therapeuticType;

    @Column(name = "therapeutic_id", nullable = false)
    private Long therapeuticId;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "taken_at", nullable = false)
    private Instant takenAt;

    @Column(name = "dosage_amount", precision = 10, scale = 4)
    private BigDecimal dosageAmount;

    @Column(name = "dosage_unit", length = 50)
    private String dosageUnit;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "skipped", nullable = false)
    private boolean skipped = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
