package dev.zeroday.health.nutrition.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal")
@Getter
@Setter
@NoArgsConstructor
public class Meal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nutrition_day_id", nullable = false)
    private NutritionDay nutritionDay;

    @Column(name = "meal_type", nullable = false, length = 50)
    private String mealType;

    private String name;

    @Column(name = "meal_order")
    private Integer mealOrder;

    @Column(name = "eaten_at")
    private LocalTime eatenAt;

    @OneToMany(mappedBy = "meal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FoodEntry> foodEntries = new ArrayList<>();
}
