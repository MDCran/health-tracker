package dev.zeroday.health.therapeutics.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "supplement")
@Getter
@Setter
@NoArgsConstructor
public class Supplement extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "dosage_amount", precision = 10, scale = 4)
    private BigDecimal dosageAmount;

    @Column(name = "dosage_unit", length = 50)
    private String dosageUnit;

    @Column(name = "frequency", length = 100)
    private String frequency;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
