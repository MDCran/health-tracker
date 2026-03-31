package dev.zeroday.health.nutrition.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "food_entry")
@Getter
@Setter
@NoArgsConstructor
public class FoodEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_id", nullable = false)
    private Meal meal;

    private String description;

    @Column(name = "serving_size")
    private String servingSize;

    private Integer calories;

    @Column(name = "protein_g", precision = 8, scale = 2)
    private BigDecimal proteinG;

    @Column(name = "carbs_g", precision = 8, scale = 2)
    private BigDecimal carbsG;

    @Column(name = "fat_g", precision = 8, scale = 2)
    private BigDecimal fatG;

    @Column(name = "fiber_g", precision = 8, scale = 2)
    private BigDecimal fiberG;

    @Column(name = "sugar_g", precision = 8, scale = 2)
    private BigDecimal sugarG;

    @Column(name = "sodium_mg", precision = 8, scale = 2)
    private BigDecimal sodiumMg;

    @Column(name = "cholesterol_mg", precision = 8, scale = 2)
    private BigDecimal cholesterolMg;

    @Column(name = "saturated_fat_g", precision = 8, scale = 2)
    private BigDecimal saturatedFatG;

    @Column(name = "trans_fat_g", precision = 8, scale = 2)
    private BigDecimal transFatG;

    @Column(name = "potassium_mg", precision = 8, scale = 2)
    private BigDecimal potassiumMg;

    @Column(name = "ai_analyzed")
    private boolean aiAnalyzed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_raw_response", columnDefinition = "jsonb")
    private String aiRawResponse;

    @Column(name = "manually_adjusted")
    private boolean manuallyAdjusted;

    @Column(name = "image_drive_file_id", length = 100)
    private String imageDriveFileId;
}
