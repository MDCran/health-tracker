package dev.zeroday.health.workout.dto;

import dev.zeroday.health.workout.model.WorkoutTemplate;
import dev.zeroday.health.workout.model.WorkoutTemplateExercise;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@AllArgsConstructor
public class WorkoutTemplateResponse {

    private Long id;
    private String name;
    private String description;
    private String color;
    private List<TemplateExerciseItem> exercises;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @AllArgsConstructor
    public static class TemplateExerciseItem {
        private Long id;
        private Long exerciseId;
        private String exerciseName;
        private Integer exerciseOrder;
        private Integer targetSets;
        private Integer targetReps;
        private BigDecimal targetWeightKg;
        private Integer restSeconds;
    }

    public static WorkoutTemplateResponse from(WorkoutTemplate template) {
        List<TemplateExerciseItem> exerciseItems = template.getExercises().stream()
                .map(te -> new TemplateExerciseItem(
                        te.getId(),
                        te.getExercise().getId(),
                        te.getExercise().getName(),
                        te.getExerciseOrder(),
                        te.getTargetSets(),
                        te.getTargetReps(),
                        te.getTargetWeightKg(),
                        te.getRestSeconds()
                ))
                .toList();

        return new WorkoutTemplateResponse(
                template.getId(),
                template.getName(),
                template.getDescription(),
                template.getColor(),
                exerciseItems,
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
