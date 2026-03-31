package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.WorkoutTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, Long> {

    List<WorkoutTemplate> findByUserId(Long userId);
}
