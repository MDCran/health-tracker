package dev.zeroday.health.sleep.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sleep_interruption")
@Getter
@Setter
@NoArgsConstructor
public class SleepInterruption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sleep_entry_id", nullable = false)
    private SleepEntry sleepEntry;

    @Column(name = "woke_at", nullable = false)
    private Instant wokeAt;

    @Column(name = "fell_back_at")
    private Instant fellBackAt;

    @Column(name = "duration_min")
    private Integer durationMin;

    @Column(columnDefinition = "text")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
