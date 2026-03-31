package dev.zeroday.health.habits.repository;

import dev.zeroday.health.habits.model.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {

    List<HabitLog> findByHabitIdAndDateBetween(Long habitId, LocalDate from, LocalDate to);

    List<HabitLog> findByHabitIdOrderByDateDesc(Long habitId);

    boolean existsByHabitIdAndDate(Long habitId, LocalDate date);

    Optional<HabitLog> findByHabitIdAndDate(Long habitId, LocalDate date);
}
