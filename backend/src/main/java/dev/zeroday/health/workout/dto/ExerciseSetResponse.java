package dev.zeroday.health.workout.dto;

import dev.zeroday.health.workout.model.ExerciseSet;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@AllArgsConstructor
public class ExerciseSetResponse {

    private Long id;
    private Integer setNumber;
    private String setType;
    private Integer reps;
    private BigDecimal weightKg;
    private Integer durationSeconds;
    private Integer restSeconds;
    private boolean completed;
    private BigDecimal rpe;
    private String notes;
    private Instant createdAt;

    public static ExerciseSetResponse from(ExerciseSet set) {
        return new ExerciseSetResponse(
                set.getId(),
                set.getSetNumber(),
                set.getSetType(),
                set.getReps(),
                set.getWeightKg(),
                set.getDurationSeconds(),
                set.getRestSeconds(),
                set.isCompleted(),
                set.getRpe(),
                set.getNotes(),
                set.getCreatedAt()
        );
    }
}
