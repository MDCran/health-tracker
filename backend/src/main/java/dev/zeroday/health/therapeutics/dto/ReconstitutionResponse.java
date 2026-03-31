package dev.zeroday.health.therapeutics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@AllArgsConstructor
public class ReconstitutionResponse {

    private BigDecimal totalAmountMg;
    private BigDecimal bacWaterMl;
    private BigDecimal concentrationMgPerMl;
    private BigDecimal concentrationMcgPerUnit;
    private List<CompoundConcentrationResponse> compounds;
}
