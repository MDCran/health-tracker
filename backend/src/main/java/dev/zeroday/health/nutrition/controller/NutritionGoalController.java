package dev.zeroday.health.nutrition.controller;

import dev.zeroday.health.nutrition.dto.NutritionGoalRequest;
import dev.zeroday.health.nutrition.dto.NutritionGoalResponse;
import dev.zeroday.health.nutrition.service.NutritionGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/nutrition/goals")
@RequiredArgsConstructor
public class NutritionGoalController {

    private final NutritionGoalService goalService;

    @GetMapping
    public ResponseEntity<NutritionGoalResponse> getGoals() {
        return goalService.getGoals()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping
    public ResponseEntity<NutritionGoalResponse> setGoals(@Valid @RequestBody NutritionGoalRequest request) {
        return ResponseEntity.ok(goalService.setGoals(request));
    }
}
