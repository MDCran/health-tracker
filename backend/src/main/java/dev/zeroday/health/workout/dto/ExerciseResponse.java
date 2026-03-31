package dev.zeroday.health.workout.dto;

import dev.zeroday.health.workout.model.Exercise;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ExerciseResponse {

    private Long id;
    private String name;
    private String forceType;
    private String level;
    private String mechanic;
    private String equipment;
    private String category;
    private List<String> primaryMuscles;
    private List<String> secondaryMuscles;
    private List<String> instructions;
    private String bodyPart;
    private String targetMuscle;
    private String gifUrl;
    private List<String> videoUrls;
    private String description;
    private String difficulty;
    private String source;
    private boolean isCustom;
    private Instant createdAt;

    public static ExerciseResponse from(Exercise exercise) {
        return ExerciseResponse.builder()
                .id(exercise.getId())
                .name(exercise.getName())
                .forceType(exercise.getForceType())
                .level(exercise.getLevel())
                .mechanic(exercise.getMechanic())
                .equipment(exercise.getEquipment())
                .category(exercise.getCategory())
                .primaryMuscles(exercise.getPrimaryMuscles())
                .secondaryMuscles(exercise.getSecondaryMuscles())
                .instructions(exercise.getInstructions())
                .bodyPart(exercise.getBodyPart())
                .targetMuscle(exercise.getTargetMuscle())
                .gifUrl(exercise.getGifUrl())
                .videoUrls(exercise.getVideoUrls())
                .description(exercise.getDescription())
                .difficulty(exercise.getDifficulty())
                .source(exercise.getSource())
                .isCustom(exercise.isCustom())
                .createdAt(exercise.getCreatedAt())
                .build();
    }
}
