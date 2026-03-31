package dev.zeroday.health.nutrition.repository;

import dev.zeroday.health.nutrition.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    List<Meal> findByNutritionDayId(Long nutritionDayId);

    List<Meal> findByNutritionDayIdAndMealType(Long nutritionDayId, String mealType);
}
