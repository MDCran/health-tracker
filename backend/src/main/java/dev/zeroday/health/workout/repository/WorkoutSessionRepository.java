package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.WorkoutSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {

    Page<WorkoutSession> findByUserIdOrderByDateDesc(Long userId, Pageable pageable);

    List<WorkoutSession> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);
}
