package dev.zeroday.health.therapeutics.repository;

import dev.zeroday.health.therapeutics.model.TherapeuticLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TherapeuticLogRepository extends JpaRepository<TherapeuticLog, Long> {

    List<TherapeuticLog> findByUserIdAndTakenAtBetween(Long userId, Instant start, Instant end);

    List<TherapeuticLog> findByTherapeuticTypeAndTherapeuticIdAndTakenAtBetween(
            String therapeuticType, Long therapeuticId, Instant start, Instant end);

    List<TherapeuticLog> findByUserIdAndTherapeuticTypeAndTakenAtBetween(
            Long userId, String therapeuticType, Instant start, Instant end);

    Optional<TherapeuticLog> findByIdAndUserId(Long id, Long userId);
}
