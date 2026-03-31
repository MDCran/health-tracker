package dev.zeroday.health.nutrition.repository;

import dev.zeroday.health.nutrition.model.NutritionGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NutritionGoalRepository extends JpaRepository<NutritionGoal, Long> {

    Optional<NutritionGoal> findByUserId(Long userId);
}
