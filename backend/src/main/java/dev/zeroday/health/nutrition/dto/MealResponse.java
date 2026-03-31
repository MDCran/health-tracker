package dev.zeroday.health.nutrition.dto;

import dev.zeroday.health.nutrition.model.Meal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealResponse {

    private Long id;
    private String mealType;
    private String name;
    private Integer mealOrder;
    private LocalTime eatenAt;
    private List<FoodEntryResponse> foodEntries;
    private Instant createdAt;
    private Instant updatedAt;

    public static MealResponse from(Meal meal) {
        List<FoodEntryResponse> entries = meal.getFoodEntries() != null
                ? meal.getFoodEntries().stream().map(FoodEntryResponse::from).toList()
                : List.of();

        return MealResponse.builder()
                .id(meal.getId())
                .mealType(meal.getMealType())
                .name(meal.getName())
                .mealOrder(meal.getMealOrder())
                .eatenAt(meal.getEatenAt())
                .foodEntries(entries)
                .createdAt(meal.getCreatedAt())
                .updatedAt(meal.getUpdatedAt())
                .build();
    }
}
