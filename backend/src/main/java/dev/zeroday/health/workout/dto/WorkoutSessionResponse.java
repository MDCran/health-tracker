package dev.zeroday.health.workout.dto;

import dev.zeroday.health.workout.model.WorkoutSession;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class WorkoutSessionResponse {

    private Long id;
    private Long templateId;
    private String name;
    private LocalDate date;
    private Instant startedAt;
    private Instant finishedAt;
    private Integer durationSeconds;
    private String notes;
    private List<WorkoutExerciseResponse> exercises;
    private Instant createdAt;
    private Instant updatedAt;

    public static WorkoutSessionResponse from(WorkoutSession session) {
        List<WorkoutExerciseResponse> exerciseResponses = session.getExercises().stream()
                .map(WorkoutExerciseResponse::from)
                .toList();

        return new WorkoutSessionResponse(
                session.getId(),
                session.getTemplate() != null ? session.getTemplate().getId() : null,
                session.getName(),
                session.getDate(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getDurationSeconds(),
                session.getNotes(),
                exerciseResponses,
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    public static WorkoutSessionResponse fromSummary(WorkoutSession session) {
        return new WorkoutSessionResponse(
                session.getId(),
                session.getTemplate() != null ? session.getTemplate().getId() : null,
                session.getName(),
                session.getDate(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getDurationSeconds(),
                session.getNotes(),
                null,
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
