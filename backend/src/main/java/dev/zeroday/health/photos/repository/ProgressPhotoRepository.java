package dev.zeroday.health.photos.repository;

import dev.zeroday.health.photos.model.ProgressPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ProgressPhotoRepository extends JpaRepository<ProgressPhoto, Long> {

    List<ProgressPhoto> findByUserIdOrderByTakenAtDesc(Long userId);

    List<ProgressPhoto> findByUserIdAndTakenAtBetweenOrderByTakenAtDesc(Long userId, Instant from, Instant to);

    List<ProgressPhoto> findByWorkoutSessionId(Long workoutSessionId);

    Optional<ProgressPhoto> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);
}
