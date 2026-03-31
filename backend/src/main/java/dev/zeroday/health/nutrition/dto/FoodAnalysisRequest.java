package dev.zeroday.health.nutrition.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FoodAnalysisRequest {

    @NotBlank(message = "Description is required")
    private String description;
}
