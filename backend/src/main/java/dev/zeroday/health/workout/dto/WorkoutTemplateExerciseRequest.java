package dev.zeroday.health.workout.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class WorkoutTemplateExerciseRequest {

    @NotNull
    private Long exerciseId;

    @NotNull
    private Integer exerciseOrder;

    private Integer targetSets;
    private Integer targetReps;
    private BigDecimal targetWeightKg;
    private Integer restSeconds;
}
