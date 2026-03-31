package dev.zeroday.health.workout.dto;

import dev.zeroday.health.workout.model.PersonalRecord;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class PersonalRecordResponse {

    private Long id;
    private Long exerciseId;
    private String exerciseName;
    private String recordType;
    private BigDecimal value;
    private String unit;
    private BigDecimal weightKg;
    private Integer reps;
    private Integer setNumber;
    private LocalDate achievedAt;
    private Long workoutExerciseId;
    private Long exerciseSetId;
    private Instant createdAt;

    public static PersonalRecordResponse from(PersonalRecord record) {
        return new PersonalRecordResponse(
                record.getId(),
                record.getExercise().getId(),
                record.getExercise().getName(),
                record.getRecordType(),
                record.getValue(),
                record.getUnit(),
                record.getWeightKg(),
                record.getReps(),
                record.getSetNumber(),
                record.getAchievedAt(),
                record.getWorkoutExerciseId(),
                record.getExerciseSetId(),
                record.getCreatedAt()
        );
    }
}
