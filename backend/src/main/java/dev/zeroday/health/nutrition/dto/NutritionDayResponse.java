package dev.zeroday.health.nutrition.dto;

import dev.zeroday.health.nutrition.model.NutritionDay;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NutritionDayResponse {

    private Long id;
    private LocalDate date;
    private String notes;
    private List<MealResponse> meals;
    private DailyTotals totals;
    private Instant createdAt;
    private Instant updatedAt;

    public static NutritionDayResponse from(NutritionDay day, DailyTotals totals) {
        List<MealResponse> mealResponses = day.getMeals() != null
                ? day.getMeals().stream().map(MealResponse::from).toList()
                : List.of();

        return NutritionDayResponse.builder()
                .id(day.getId())
                .date(day.getDate())
                .notes(day.getNotes())
                .meals(mealResponses)
                .totals(totals)
                .createdAt(day.getCreatedAt())
                .updatedAt(day.getUpdatedAt())
                .build();
    }
}
