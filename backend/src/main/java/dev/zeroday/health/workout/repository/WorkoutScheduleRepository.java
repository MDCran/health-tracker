package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.WorkoutSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutScheduleRepository extends JpaRepository<WorkoutSchedule, Long> {

    List<WorkoutSchedule> findByUserIdAndActiveTrue(Long userId);
}
