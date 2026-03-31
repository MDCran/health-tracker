package dev.zeroday.health.nutrition.dto;

import dev.zeroday.health.nutrition.model.FoodEntry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodEntryResponse {

    private Long id;
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
    private boolean aiAnalyzed;
    private boolean manuallyAdjusted;
    private boolean hasImage;
    private Instant createdAt;
    private Instant updatedAt;

    public static FoodEntryResponse from(FoodEntry entry) {
        return FoodEntryResponse.builder()
                .id(entry.getId())
                .description(entry.getDescription())
                .servingSize(entry.getServingSize())
                .calories(entry.getCalories())
                .proteinG(entry.getProteinG())
                .carbsG(entry.getCarbsG())
                .fatG(entry.getFatG())
                .fiberG(entry.getFiberG())
                .sugarG(entry.getSugarG())
                .sodiumMg(entry.getSodiumMg())
                .cholesterolMg(entry.getCholesterolMg())
                .saturatedFatG(entry.getSaturatedFatG())
                .transFatG(entry.getTransFatG())
                .potassiumMg(entry.getPotassiumMg())
                .aiAnalyzed(entry.isAiAnalyzed())
                .manuallyAdjusted(entry.isManuallyAdjusted())
                .hasImage(entry.getImageDriveFileId() != null)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
