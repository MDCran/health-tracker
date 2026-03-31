package dev.zeroday.health.metrics.repository;

import dev.zeroday.health.metrics.model.BodyMetric;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BodyMetricRepository extends JpaRepository<BodyMetric, Long> {

    List<BodyMetric> findByUserIdAndMetricTypeOrderByMeasuredAtDesc(Long userId, String metricType);

    Page<BodyMetric> findByUserIdAndMetricTypeOrderByMeasuredAtDesc(Long userId, String metricType, Pageable pageable);

    List<BodyMetric> findByUserIdAndMetricTypeAndMeasuredAtBetween(
            Long userId, String metricType, Instant from, Instant to);

    Optional<BodyMetric> findTopByUserIdAndMetricTypeOrderByMeasuredAtDesc(Long userId, String metricType);

    Page<BodyMetric> findByUserIdOrderByMeasuredAtDesc(Long userId, Pageable pageable);
}
