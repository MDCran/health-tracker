package dev.zeroday.health.nutrition.dto;

import dev.zeroday.health.nutrition.model.NutritionGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NutritionGoalResponse {

    private Long id;
    private Integer calories;
    private BigDecimal proteinG;
    private BigDecimal carbsG;
    private BigDecimal fatG;
    private BigDecimal fiberG;

    public static NutritionGoalResponse from(NutritionGoal goal) {
        return NutritionGoalResponse.builder()
                .id(goal.getId())
                .calories(goal.getCalories())
                .proteinG(goal.getProteinG())
                .carbsG(goal.getCarbsG())
                .fatG(goal.getFatG())
                .fiberG(goal.getFiberG())
                .build();
    }
}
