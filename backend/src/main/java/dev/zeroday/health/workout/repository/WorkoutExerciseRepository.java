package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.WorkoutExercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, Long> {

    List<WorkoutExercise> findBySessionId(Long sessionId);
}
