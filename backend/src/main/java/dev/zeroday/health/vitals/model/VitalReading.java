package dev.zeroday.health.vitals.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "vital_reading")
@Getter
@Setter
@NoArgsConstructor
public class VitalReading extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "vital_type", nullable = false, length = 50)
    private String vitalType;

    @Column(name = "custom_name", length = 100)
    private String customName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(precision = 10, scale = 2)
    private BigDecimal value2;

    @Column(length = 20)
    private String unit;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;

    private String notes;
}
