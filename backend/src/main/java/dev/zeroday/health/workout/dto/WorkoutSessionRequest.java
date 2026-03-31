package dev.zeroday.health.workout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class WorkoutSessionRequest {

    private Long templateId;

    @NotBlank
    private String name;

    @NotNull
    private LocalDate date;

    private String notes;
}
