package dev.zeroday.health.therapeutics.service;

import dev.zeroday.health.therapeutics.dto.CompoundConcentrationResponse;
import dev.zeroday.health.therapeutics.dto.ReconstitutionResponse;
import dev.zeroday.health.therapeutics.model.PeptideCompound;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;

@Component
public class ReconstitutionCalculator {

    private static final BigDecimal UNITS_PER_ML = new BigDecimal("100");
    private static final BigDecimal MCG_PER_MG = new BigDecimal("1000");
    private static final int SCALE = 6;
    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);


    public ReconstitutionResponse calculate(BigDecimal totalAmountMg, BigDecimal bacWaterMl,
                                            List<PeptideCompound> compounds) {
        BigDecimal concentrationMgPerMl = totalAmountMg.divide(bacWaterMl, SCALE, RoundingMode.HALF_UP);
        BigDecimal concentrationMcgPerUnit = calculateMcgPerUnit(totalAmountMg, bacWaterMl);

        List<CompoundConcentrationResponse> compoundConcentrations = compounds.stream()
                .map(compound -> calculateCompoundConcentration(compound, bacWaterMl))
                .toList();

        return new ReconstitutionResponse(
                totalAmountMg,
                bacWaterMl,
                concentrationMgPerMl,
                concentrationMcgPerUnit,
                compoundConcentrations
        );
    }


    public BigDecimal calculateConcentrationMgPerMl(BigDecimal totalAmountMg, BigDecimal bacWaterMl) {
        return totalAmountMg.divide(bacWaterMl, SCALE, RoundingMode.HALF_UP);
    }


    public BigDecimal calculateMcgPerUnit(BigDecimal totalAmountMg, BigDecimal bacWaterMl) {
        BigDecimal totalMcg = totalAmountMg.multiply(MCG_PER_MG, MC);
        BigDecimal totalUnits = bacWaterMl.multiply(UNITS_PER_ML, MC);
        return totalMcg.divide(totalUnits, SCALE, RoundingMode.HALF_UP);
    }

    private CompoundConcentrationResponse calculateCompoundConcentration(PeptideCompound compound,
                                                                         BigDecimal bacWaterMl) {
        BigDecimal compoundMgPerMl = compound.getAmountMg().divide(bacWaterMl, SCALE, RoundingMode.HALF_UP);
        BigDecimal compoundMcgPerUnit = calculateMcgPerUnit(compound.getAmountMg(), bacWaterMl);

        return new CompoundConcentrationResponse(
                compound.getCompoundName(),
                compound.getAmountMg(),
                compoundMgPerMl,
                compoundMcgPerUnit
        );
    }
}
