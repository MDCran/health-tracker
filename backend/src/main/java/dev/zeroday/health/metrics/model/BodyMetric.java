package dev.zeroday.health.metrics.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "body_metric")
@Getter
@Setter
@NoArgsConstructor
public class BodyMetric extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "metric_type", nullable = false, length = 50)
    private String metricType;

    @Column(name = "custom_name")
    private String customName;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal value;

    @Column(length = 20)
    private String unit;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;

    private String notes;
}
