package dev.zeroday.health.therapeutics.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class PeptideRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Total amount in mg is required")
    @Positive(message = "Total amount must be positive")
    private BigDecimal totalAmountMg;

    @NotNull(message = "BAC water in ml is required")
    @Positive(message = "BAC water must be positive")
    private BigDecimal bacWaterMl;

    private String notes;

    @Valid
    private List<PeptideCompoundRequest> compounds;
}
