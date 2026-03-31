package dev.zeroday.health.nutrition.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "nutrition_day")
@Getter
@Setter
@NoArgsConstructor
public class NutritionDay extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    private String notes;

    @OneToMany(mappedBy = "nutritionDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("mealOrder ASC")
    private List<Meal> meals = new ArrayList<>();
}
