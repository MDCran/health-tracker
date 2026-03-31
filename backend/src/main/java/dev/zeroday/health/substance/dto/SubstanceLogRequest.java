package dev.zeroday.health.substance.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class SubstanceLogRequest {

    @NotBlank(message = "Substance type is required")
    private String substanceType;

    @NotNull(message = "Occurred at is required")
    private Instant occurredAt;

    private String amount;

    private String notes;

    private String context;

    @Min(1) @Max(5)
    private Integer moodBefore;

    @Min(1) @Max(5)
    private Integer moodAfter;
}
