package dev.zeroday.health.nutrition.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalTime;

@Data
public class MealRequest {

    @NotBlank(message = "Meal type is required")
    private String mealType;

    private String name;

    private LocalTime eatenAt;
}
