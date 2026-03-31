package dev.zeroday.health.nutrition.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.nutrition.dto.FoodAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ApiNinjasNutritionClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public ApiNinjasNutritionClient(
            @Value("${api-ninjas.api-key:}") String apiKey,
            @Value("${api-ninjas.base-url:https://api.api-ninjas.com/v1}") String baseUrl,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.enabled = StringUtils.hasText(apiKey);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-Api-Key", apiKey)
                .build();
    }

    public boolean isEnabled() {
        return enabled;
    }


    public FoodAnalysisResponse analyzeWithKey(String foodDescription, String apiKey) {
        RestClient client = RestClient.builder()
                .baseUrl("https://api.api-ninjas.com/v1")
                .defaultHeader("X-Api-Key", apiKey)
                .build();
        try {
            String json = client.get()
                    .uri("/nutrition?query={query}", foodDescription)
                    .retrieve()
                    .body(String.class);
            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            return mapToResponse(items);
        } catch (Exception e) {
            log.error("API Ninjas (user key) nutrition analysis failed: {}", e.getMessage());
            throw new RuntimeException("Nutrition analysis failed: " + e.getMessage(), e);
        }
    }

    public FoodAnalysisResponse analyze(String foodDescription) {
        if (!enabled) {
            throw new IllegalStateException("API Ninjas nutrition API is not configured");
        }

        try {
            String json = restClient.get()
                    .uri("/nutrition?query={query}", foodDescription)
                    .retrieve()
                    .body(String.class);

            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            return mapToResponse(items);
        } catch (Exception e) {
            log.error("API Ninjas nutrition analysis failed: {}", e.getMessage());
            throw new RuntimeException("Nutrition analysis failed: " + e.getMessage(), e);
        }
    }

    private FoodAnalysisResponse mapToResponse(List<Map<String, Object>> items) {
        List<FoodAnalysisResponse.AnalyzedFood> foods = new ArrayList<>();

        BigDecimal totalCalories = BigDecimal.ZERO;
        BigDecimal totalProtein = BigDecimal.ZERO;
        BigDecimal totalCarbs = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;
        BigDecimal totalFiber = BigDecimal.ZERO;
        BigDecimal totalSugar = BigDecimal.ZERO;
        BigDecimal totalSodium = BigDecimal.ZERO;
        BigDecimal totalCholesterol = BigDecimal.ZERO;
        BigDecimal totalSaturatedFat = BigDecimal.ZERO;

        for (Map<String, Object> item : items) {
            BigDecimal calories = toBigDecimal(item.get("calories"));
            BigDecimal protein = toBigDecimal(item.get("protein_g"));
            BigDecimal carbs = toBigDecimal(item.get("carbohydrates_total_g"));
            BigDecimal fat = toBigDecimal(item.get("fat_total_g"));
            BigDecimal fiber = toBigDecimal(item.get("fiber_g"));
            BigDecimal sugar = toBigDecimal(item.get("sugar_g"));
            BigDecimal sodium = toBigDecimal(item.get("sodium_mg"));
            BigDecimal cholesterol = toBigDecimal(item.get("cholesterol_mg"));
            BigDecimal saturatedFat = toBigDecimal(item.get("fat_saturated_g"));
            BigDecimal servingSizeG = toBigDecimal(item.get("serving_size_g"));
            BigDecimal potassium = toBigDecimal(item.get("potassium_mg"));

            if (protein.compareTo(BigDecimal.ZERO) == 0 && calories.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal fatCals = fat.multiply(BigDecimal.valueOf(9));
                BigDecimal carbCals = carbs.multiply(BigDecimal.valueOf(4));
                BigDecimal remainingCals = calories.subtract(fatCals).subtract(carbCals);
                if (remainingCals.compareTo(BigDecimal.ZERO) > 0) {
                    protein = remainingCals.divide(BigDecimal.valueOf(4), 1, RoundingMode.HALF_UP);
                }
            }

            if (calories.compareTo(BigDecimal.ZERO) == 0
                    && (carbs.compareTo(BigDecimal.ZERO) > 0 || protein.compareTo(BigDecimal.ZERO) > 0 || fat.compareTo(BigDecimal.ZERO) > 0)) {
                calories = carbs.multiply(BigDecimal.valueOf(4))
                        .add(protein.multiply(BigDecimal.valueOf(4)))
                        .add(fat.multiply(BigDecimal.valueOf(9)))
                        .setScale(0, RoundingMode.HALF_UP);
            }

            String servingLabel;
            if (servingSizeG.compareTo(BigDecimal.ZERO) > 0) {
                double grams = servingSizeG.doubleValue();
                if (grams >= 1000) {
                    servingLabel = servingSizeG.divide(BigDecimal.valueOf(1000), 1, RoundingMode.HALF_UP) + "kg";
                } else {
                    servingLabel = servingSizeG.setScale(0, RoundingMode.HALF_UP) + "g";
                }
            } else {
                servingLabel = "1 serving";
            }

            foods.add(FoodAnalysisResponse.AnalyzedFood.builder()
                    .name((String) item.get("name"))
                    .servingSize(servingLabel)
                    .servingSizeG(servingSizeG)
                    .calories(calories.intValue())
                    .proteinG(protein.setScale(1, RoundingMode.HALF_UP))
                    .carbsG(carbs.setScale(1, RoundingMode.HALF_UP))
                    .fatG(fat.setScale(1, RoundingMode.HALF_UP))
                    .fiberG(fiber.setScale(1, RoundingMode.HALF_UP))
                    .sugarG(sugar.setScale(1, RoundingMode.HALF_UP))
                    .sodiumMg(sodium.setScale(0, RoundingMode.HALF_UP))
                    .cholesterolMg(cholesterol.setScale(0, RoundingMode.HALF_UP))
                    .saturatedFatG(saturatedFat.setScale(1, RoundingMode.HALF_UP))
                    .transFatG(BigDecimal.ZERO)
                    .addedSugarsG(BigDecimal.ZERO)
                    .potassiumMg(potassium.setScale(0, RoundingMode.HALF_UP))
                    .build());

            totalCalories = totalCalories.add(calories);
            totalProtein = totalProtein.add(protein);
            totalCarbs = totalCarbs.add(carbs);
            totalFat = totalFat.add(fat);
            totalFiber = totalFiber.add(fiber);
            totalSugar = totalSugar.add(sugar);
            totalSodium = totalSodium.add(sodium);
            totalCholesterol = totalCholesterol.add(cholesterol);
            totalSaturatedFat = totalSaturatedFat.add(saturatedFat);
        }

        return FoodAnalysisResponse.builder()
                .foods(foods)
                .totals(FoodAnalysisResponse.Totals.builder()
                        .calories(totalCalories.intValue())
                        .proteinG(totalProtein)
                        .carbsG(totalCarbs)
                        .fatG(totalFat)
                        .fiberG(totalFiber)
                        .sugarG(totalSugar)
                        .sodiumMg(totalSodium)
                        .cholesterolMg(totalCholesterol)
                        .saturatedFatG(totalSaturatedFat)
                        .build())
                .confidence("high")
                .notes("Data from API Ninjas (USDA-based)")
                .build();
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(obj.toString());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}
