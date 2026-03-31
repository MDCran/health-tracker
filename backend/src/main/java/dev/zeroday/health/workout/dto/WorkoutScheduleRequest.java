package dev.zeroday.health.workout.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class WorkoutScheduleRequest {

    @NotNull
    private Long templateId;

    private List<Integer> daysOfWeek;
    private LocalTime timeOfDay;
    private boolean active = true;
    private LocalDate startDate;
    private LocalDate endDate;
}
