package dev.zeroday.health.sleep.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sleep_entry", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "date"})
})
@Getter
@Setter
@NoArgsConstructor
public class SleepEntry extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Instant bedtime;

    @Column(name = "wake_time", nullable = false)
    private Instant wakeTime;

    @Column(name = "total_minutes")
    private Integer totalMinutes;

    @Column(name = "sleep_quality")
    private Integer sleepQuality;

    @Column(name = "feel_rested")
    private Integer feelRested;

    @Column(name = "sleep_latency_min")
    private Integer sleepLatencyMin;

    @Column(columnDefinition = "text")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "survey_responses", columnDefinition = "jsonb")
    private String surveyResponses;

    @OneToMany(mappedBy = "sleepEntry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SleepInterruption> interruptions = new ArrayList<>();
}
