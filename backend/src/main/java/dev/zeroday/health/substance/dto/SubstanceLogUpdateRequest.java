package dev.zeroday.health.substance.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.Instant;

@Data
public class SubstanceLogUpdateRequest {

    private String substanceType;

    private Instant occurredAt;

    private String amount;

    private String notes;

    private String context;

    @Min(1) @Max(5)
    private Integer moodBefore;

    @Min(1) @Max(5)
    private Integer moodAfter;
}
