package dev.zeroday.health.nutrition.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "nutrition_goal")
@Getter
@Setter
@NoArgsConstructor
public class NutritionGoal extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    private Integer calories;

    @Column(name = "protein_g", precision = 8, scale = 2)
    private BigDecimal proteinG;

    @Column(name = "carbs_g", precision = 8, scale = 2)
    private BigDecimal carbsG;

    @Column(name = "fat_g", precision = 8, scale = 2)
    private BigDecimal fatG;

    @Column(name = "fiber_g", precision = 8, scale = 2)
    private BigDecimal fiberG;
}
