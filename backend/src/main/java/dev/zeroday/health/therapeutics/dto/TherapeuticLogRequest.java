package dev.zeroday.health.therapeutics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class TherapeuticLogRequest {

    @NotBlank(message = "Therapeutic type is required")
    private String therapeuticType;

    @NotNull(message = "Therapeutic ID is required")
    private Long therapeuticId;

    private Long scheduleId;

    @NotNull(message = "Taken at timestamp is required")
    private Instant takenAt;

    private BigDecimal dosageAmount;
    private String dosageUnit;
    private String notes;
    private boolean skipped;
}
