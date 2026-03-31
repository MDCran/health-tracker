package dev.zeroday.health.vitals.dto;

import dev.zeroday.health.vitals.model.VitalReading;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VitalReadingResponse {
    private Long id;
    private String vitalType;
    private String customName;
    private BigDecimal value;
    private BigDecimal value2;
    private String unit;
    private Instant measuredAt;
    private String notes;
    private Instant createdAt;

    public static VitalReadingResponse from(VitalReading v) {
        return VitalReadingResponse.builder()
                .id(v.getId()).vitalType(v.getVitalType()).customName(v.getCustomName())
                .value(v.getValue()).value2(v.getValue2()).unit(v.getUnit())
                .measuredAt(v.getMeasuredAt()).notes(v.getNotes()).createdAt(v.getCreatedAt())
                .build();
    }
}
