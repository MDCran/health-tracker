package dev.zeroday.health.nutrition.repository;

import dev.zeroday.health.nutrition.model.FoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodEntryRepository extends JpaRepository<FoodEntry, Long> {

    List<FoodEntry> findByMealId(Long mealId);
}
