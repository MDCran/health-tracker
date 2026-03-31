package dev.zeroday.health.metrics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class BodyMetricRequest {

    @NotBlank(message = "Metric type is required")
    private String metricType;

    private String customName;

    @NotNull(message = "Value is required")
    private BigDecimal value;

    private String unit;

    private Instant measuredAt;

    private String notes;
}
