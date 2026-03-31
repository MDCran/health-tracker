package dev.zeroday.health.nutrition.service;

import dev.zeroday.health.nutrition.dto.NutritionGoalRequest;
import dev.zeroday.health.nutrition.dto.NutritionGoalResponse;
import dev.zeroday.health.nutrition.model.NutritionGoal;
import dev.zeroday.health.nutrition.repository.NutritionGoalRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NutritionGoalService {

    private final NutritionGoalRepository goalRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Optional<NutritionGoalResponse> getGoals() {
        Long userId = userService.getCurrentUserId();
        return goalRepository.findByUserId(userId)
                .map(NutritionGoalResponse::from);
    }

    @Transactional
    public NutritionGoalResponse setGoals(NutritionGoalRequest request) {
        Long userId = userService.getCurrentUserId();
        NutritionGoal goal = goalRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NutritionGoal newGoal = new NutritionGoal();
                    newGoal.setUserId(userId);
                    return newGoal;
                });

        goal.setCalories(request.getCalories());
        goal.setProteinG(request.getProteinG());
        goal.setCarbsG(request.getCarbsG());
        goal.setFatG(request.getFatG());
        goal.setFiberG(request.getFiberG());

        goal = goalRepository.save(goal);
        return NutritionGoalResponse.from(goal);
    }
}
