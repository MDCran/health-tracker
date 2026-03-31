package dev.zeroday.health.workout.dto;

import dev.zeroday.health.workout.model.WorkoutExercise;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@AllArgsConstructor
public class WorkoutExerciseResponse {

    private Long id;
    private ExerciseResponse exercise;
    private Integer exerciseOrder;
    private String notes;
    private Integer restSeconds;
    private Instant startedAt;
    private Instant finishedAt;
    private Integer durationSeconds;
    private List<ExerciseSetResponse> sets;
    private Instant createdAt;

    public static WorkoutExerciseResponse from(WorkoutExercise we) {
        List<ExerciseSetResponse> setResponses = we.getSets().stream()
                .map(ExerciseSetResponse::from)
                .toList();

        return new WorkoutExerciseResponse(
                we.getId(),
                ExerciseResponse.from(we.getExercise()),
                we.getExerciseOrder(),
                we.getNotes(),
                we.getRestSeconds(),
                we.getStartedAt(),
                we.getFinishedAt(),
                we.getDurationSeconds(),
                setResponses,
                we.getCreatedAt()
        );
    }
}
