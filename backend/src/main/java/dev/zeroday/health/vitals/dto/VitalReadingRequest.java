package dev.zeroday.health.vitals.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class VitalReadingRequest {
    @NotBlank private String vitalType;
    private String customName;
    @NotNull private BigDecimal value;
    private BigDecimal value2;
    private String unit;
    private Instant measuredAt;
    private String notes;
}
