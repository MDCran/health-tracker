package dev.zeroday.health.workout.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "personal_record")
@Getter
@Setter
@NoArgsConstructor
public class PersonalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "record_type", nullable = false, length = 30)
    private String recordType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(length = 20)
    private String unit;

    @Column(name = "weight_kg", precision = 10, scale = 2)
    private BigDecimal weightKg;

    @Column
    private Integer reps;

    @Column(name = "set_number")
    private Integer setNumber;

    @Column(name = "achieved_at", nullable = false)
    private LocalDate achievedAt;

    @Column(name = "workout_exercise_id")
    private Long workoutExerciseId;

    @Column(name = "exercise_set_id")
    private Long exerciseSetId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
