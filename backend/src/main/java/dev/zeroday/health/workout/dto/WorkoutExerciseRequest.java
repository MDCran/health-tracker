package dev.zeroday.health.workout.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkoutExerciseRequest {

    @NotNull
    private Long exerciseId;

    @NotNull
    private Integer exerciseOrder;

    private String notes;
    private Integer restSeconds;
}
