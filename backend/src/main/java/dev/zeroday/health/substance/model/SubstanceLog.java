package dev.zeroday.health.substance.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "substance_log")
@Getter
@Setter
@NoArgsConstructor
public class SubstanceLog extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "substance_type", nullable = false)
    private String substanceType;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column
    private String amount;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(columnDefinition = "text")
    private String context;

    @Column(name = "mood_before")
    private Integer moodBefore;

    @Column(name = "mood_after")
    private Integer moodAfter;
}
