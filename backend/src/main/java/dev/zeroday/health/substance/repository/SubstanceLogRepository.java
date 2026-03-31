package dev.zeroday.health.substance.repository;

import dev.zeroday.health.substance.model.SubstanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubstanceLogRepository extends JpaRepository<SubstanceLog, Long> {

    List<SubstanceLog> findByUserIdAndSubstanceTypeOrderByOccurredAtDesc(Long userId, String substanceType);

    List<SubstanceLog> findByUserIdOrderByOccurredAtDesc(Long userId);

    List<SubstanceLog> findByUserIdAndSubstanceTypeAndOccurredAtBetween(
            Long userId, String substanceType, Instant from, Instant to);

    Optional<SubstanceLog> findTopByUserIdAndSubstanceTypeOrderByOccurredAtDesc(
            Long userId, String substanceType);

    long countByUserIdAndSubstanceType(Long userId, String substanceType);

    long countByUserIdAndSubstanceTypeAndOccurredAtBetween(
            Long userId, String substanceType, Instant from, Instant to);

    @Query("SELECT DISTINCT s.substanceType FROM SubstanceLog s WHERE s.userId = :userId ORDER BY s.substanceType")
    List<String> findDistinctSubstanceTypesByUserId(Long userId);
}
