package dev.zeroday.health.nutrition.repository;

import dev.zeroday.health.nutrition.model.NutritionDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface NutritionDayRepository extends JpaRepository<NutritionDay, Long> {

    Optional<NutritionDay> findByUserIdAndDate(Long userId, LocalDate date);

    List<NutritionDay> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
}
