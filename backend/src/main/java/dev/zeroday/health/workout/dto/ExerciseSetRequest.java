package dev.zeroday.health.workout.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ExerciseSetRequest {

    @NotNull
    private Integer setNumber;

    private String setType;
    private Integer reps;
    private BigDecimal weightKg;
    private Integer durationSeconds;
    private boolean completed;
    private BigDecimal rpe;
    private String notes;
}
