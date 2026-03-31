package dev.zeroday.health.nutrition.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FoodEntryRequest {

    private String description;

    private String servingSize;
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
}
