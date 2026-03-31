package dev.zeroday.health.therapeutics.dto;

import dev.zeroday.health.therapeutics.model.Supplement;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@AllArgsConstructor
public class SupplementResponse {

    private Long id;
    private String name;
    private BigDecimal dosageAmount;
    private String dosageUnit;
    private String frequency;
    private String notes;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static SupplementResponse from(Supplement supplement) {
        return new SupplementResponse(
                supplement.getId(),
                supplement.getName(),
                supplement.getDosageAmount(),
                supplement.getDosageUnit(),
                supplement.getFrequency(),
                supplement.getNotes(),
                supplement.isActive(),
                supplement.getCreatedAt(),
                supplement.getUpdatedAt()
        );
    }
}
