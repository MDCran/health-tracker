package dev.zeroday.health.therapeutics.dto;

import dev.zeroday.health.therapeutics.model.Medication;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@AllArgsConstructor
public class MedicationResponse {

    private Long id;
    private String name;
    private BigDecimal dosageAmount;
    private String dosageUnit;
    private String frequency;
    private String notes;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static MedicationResponse from(Medication medication) {
        return new MedicationResponse(
                medication.getId(),
                medication.getName(),
                medication.getDosageAmount(),
                medication.getDosageUnit(),
                medication.getFrequency(),
                medication.getNotes(),
                medication.isActive(),
                medication.getCreatedAt(),
                medication.getUpdatedAt()
        );
    }
}
