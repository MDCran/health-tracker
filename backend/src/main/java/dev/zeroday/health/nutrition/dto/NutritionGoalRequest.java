package dev.zeroday.health.nutrition.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class NutritionGoalRequest {

    private Integer calories;
    private BigDecimal proteinG;
    private BigDecimal carbsG;
    private BigDecimal fatG;
    private BigDecimal fiberG;
}
