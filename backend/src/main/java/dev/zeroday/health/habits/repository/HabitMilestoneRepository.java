package dev.zeroday.health.habits.repository;

import dev.zeroday.health.habits.model.HabitMilestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabitMilestoneRepository extends JpaRepository<HabitMilestone, Long> {
    List<HabitMilestone> findByHabitIdOrderByAchievedAtDesc(Long habitId);
    boolean existsByHabitIdAndMilestoneTypeAndMilestoneValue(Long habitId, String type, int value);
}
