package dev.zeroday.health.metrics.dto;

import dev.zeroday.health.metrics.model.BodyMetric;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BodyMetricResponse {

    private Long id;
    private String metricType;
    private String customName;
    private BigDecimal value;
    private String unit;
    private Instant measuredAt;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static BodyMetricResponse from(BodyMetric metric) {
        return BodyMetricResponse.builder()
                .id(metric.getId())
                .metricType(metric.getMetricType())
                .customName(metric.getCustomName())
                .value(metric.getValue())
                .unit(metric.getUnit())
                .measuredAt(metric.getMeasuredAt())
                .notes(metric.getNotes())
                .createdAt(metric.getCreatedAt())
                .updatedAt(metric.getUpdatedAt())
                .build();
    }
}
