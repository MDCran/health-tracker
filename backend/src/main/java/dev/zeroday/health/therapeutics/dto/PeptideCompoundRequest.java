package dev.zeroday.health.therapeutics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PeptideCompoundRequest {

    @NotBlank(message = "Compound name is required")
    private String compoundName;

    @NotNull(message = "Amount in mg is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amountMg;
}
