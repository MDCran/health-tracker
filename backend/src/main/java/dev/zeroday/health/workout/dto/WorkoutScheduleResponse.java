package dev.zeroday.health.workout.dto;

import dev.zeroday.health.workout.model.WorkoutSchedule;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class WorkoutScheduleResponse {

    private Long id;
    private Long templateId;
    private String templateName;
    private List<Integer> daysOfWeek;
    private LocalTime timeOfDay;
    private boolean active;
    private LocalDate startDate;
    private LocalDate endDate;
    private Instant createdAt;
    private Instant updatedAt;

    public static WorkoutScheduleResponse from(WorkoutSchedule schedule) {
        return new WorkoutScheduleResponse(
                schedule.getId(),
                schedule.getTemplate().getId(),
                schedule.getTemplate().getName(),
                schedule.getDaysOfWeek(),
                schedule.getTimeOfDay(),
                schedule.isActive(),
                schedule.getStartDate(),
                schedule.getEndDate(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
}
