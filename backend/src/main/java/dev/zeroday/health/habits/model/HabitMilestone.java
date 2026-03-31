package dev.zeroday.health.habits.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "habit_milestone")
@Getter
@Setter
@NoArgsConstructor
public class HabitMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "habit_id", nullable = false)
    private Long habitId;

    @Column(name = "milestone_type", nullable = false, length = 30)
    private String milestoneType;

    @Column(name = "milestone_value", nullable = false)
    private int milestoneValue;

    @Column(name = "achieved_at", nullable = false)
    private LocalDate achievedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
