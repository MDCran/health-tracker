package dev.zeroday.health.vitals.repository;

import dev.zeroday.health.vitals.model.VitalReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface VitalReadingRepository extends JpaRepository<VitalReading, Long> {

    List<VitalReading> findByUserIdAndVitalTypeOrderByMeasuredAtDesc(Long userId, String vitalType);

    List<VitalReading> findByUserIdAndVitalTypeAndMeasuredAtBetween(Long userId, String vitalType, Instant from, Instant to);

    Optional<VitalReading> findTopByUserIdAndVitalTypeOrderByMeasuredAtDesc(Long userId, String vitalType);

    List<VitalReading> findByUserIdOrderByMeasuredAtDesc(Long userId);

    @Query("SELECT DISTINCT v.vitalType FROM VitalReading v WHERE v.userId = :userId")
    List<String> findDistinctVitalTypesByUserId(Long userId);
}
