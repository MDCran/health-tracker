package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.WorkoutTemplateExercise;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutTemplateExerciseRepository extends JpaRepository<WorkoutTemplateExercise, Long> {
}
