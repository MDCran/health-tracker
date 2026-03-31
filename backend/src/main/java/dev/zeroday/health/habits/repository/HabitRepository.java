package dev.zeroday.health.habits.repository;

import dev.zeroday.health.habits.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findByUserIdAndActiveTrue(Long userId);

    List<Habit> findByUserId(Long userId);
}
