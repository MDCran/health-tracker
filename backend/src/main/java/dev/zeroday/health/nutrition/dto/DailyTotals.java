package dev.zeroday.health.nutrition.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTotals {

    private Integer calories;
    private BigDecimal proteinG;
    private BigDecimal carbsG;
    private BigDecimal fatG;
    private BigDecimal fiberG;
    private BigDecimal sugarG;
    private BigDecimal sodiumMg;
    private BigDecimal cholesterolMg;
    private BigDecimal saturatedFatG;
    private BigDecimal transFatG;
    private BigDecimal potassiumMg;

    public static DailyTotals empty() {
        return DailyTotals.builder()
                .calories(0)
                .proteinG(BigDecimal.ZERO)
                .carbsG(BigDecimal.ZERO)
                .fatG(BigDecimal.ZERO)
                .fiberG(BigDecimal.ZERO)
                .sugarG(BigDecimal.ZERO)
                .sodiumMg(BigDecimal.ZERO)
                .cholesterolMg(BigDecimal.ZERO)
                .saturatedFatG(BigDecimal.ZERO)
                .transFatG(BigDecimal.ZERO)
                .potassiumMg(BigDecimal.ZERO)
                .build();
    }
}
