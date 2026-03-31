package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.ExerciseSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseSetRepository extends JpaRepository<ExerciseSet, Long> {

    List<ExerciseSet> findByWorkoutExerciseId(Long workoutExerciseId);
}
