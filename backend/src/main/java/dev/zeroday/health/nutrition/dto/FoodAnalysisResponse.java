package dev.zeroday.health.nutrition.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodAnalysisResponse {

    private List<AnalyzedFood> foods;
    private Totals totals;
    private String confidence;
    private String notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyzedFood {
        private String name;
        private String servingSize;
        private BigDecimal servingSizeG;
        private int calories;
        private BigDecimal proteinG;
        private BigDecimal carbsG;
        private BigDecimal fatG;
        private BigDecimal fiberG;
        private BigDecimal sugarG;
        private BigDecimal sodiumMg;
        private BigDecimal cholesterolMg;
        private BigDecimal saturatedFatG;
        private BigDecimal transFatG;
        private BigDecimal addedSugarsG;
        private BigDecimal potassiumMg;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Totals {
        private int calories;
        private BigDecimal proteinG;
        private BigDecimal carbsG;
        private BigDecimal fatG;
        private BigDecimal fiberG;
        private BigDecimal sugarG;
        private BigDecimal sodiumMg;
        private BigDecimal cholesterolMg;
        private BigDecimal saturatedFatG;
    }
}
