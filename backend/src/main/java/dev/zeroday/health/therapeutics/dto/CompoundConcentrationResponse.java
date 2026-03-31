package dev.zeroday.health.therapeutics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class CompoundConcentrationResponse {

    private String compoundName;
    private BigDecimal amountMg;
    private BigDecimal concentrationMgPerMl;
    private BigDecimal concentrationMcgPerUnit;
}
