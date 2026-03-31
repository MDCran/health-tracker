package dev.zeroday.health.workout.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class WorkoutTemplateRequest {

    @NotBlank
    private String name;

    private String description;
    private String color;

    @Valid
    private List<WorkoutTemplateExerciseRequest> exercises;
}
