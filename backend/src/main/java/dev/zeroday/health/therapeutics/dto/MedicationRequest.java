package dev.zeroday.health.therapeutics.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class MedicationRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private BigDecimal dosageAmount;
    private String dosageUnit;
    private String frequency;
    private String notes;
}
