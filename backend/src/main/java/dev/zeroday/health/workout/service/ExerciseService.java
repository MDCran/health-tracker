package dev.zeroday.health.workout.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.user.UserService;
import dev.zeroday.health.workout.model.Exercise;
import dev.zeroday.health.workout.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final UserService userService;

    public List<Exercise> search(String query, String category, String muscle) {
        List<Exercise> results;

        if (query != null && !query.isBlank()) {
            results = exerciseRepository.findByNameContainingIgnoreCase(query.trim());
        } else {
            results = exerciseRepository.findAll();
        }

        if (category != null && !category.isBlank()) {
            String cat = category.trim().toLowerCase();
            results = results.stream()
                    .filter(e -> e.getCategory() != null && e.getCategory().equalsIgnoreCase(cat))
                    .toList();
        }

        if (muscle != null && !muscle.isBlank()) {
            String m = muscle.trim().toLowerCase();
            results = results.stream()
                    .filter(e -> (e.getPrimaryMuscles() != null &&
                            e.getPrimaryMuscles().stream().anyMatch(pm -> pm.equalsIgnoreCase(m))) ||
                            (e.getTargetMuscle() != null && e.getTargetMuscle().equalsIgnoreCase(m)) ||
                            (e.getSecondaryMuscles() != null &&
                                    e.getSecondaryMuscles().stream().anyMatch(sm -> sm.equalsIgnoreCase(m))))
                    .toList();
        }

        return results;
    }

    public List<Exercise> autocomplete(String query) {
        Long userId = userService.getCurrentUserId();
        return exerciseRepository.autocomplete(userId, query.trim(), 15);
    }

    public Exercise getById(Long id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise", id));
    }

    @Transactional
    public Exercise createCustom(Exercise exercise) {
        exercise.setCustom(true);
        exercise.setUserId(userService.getCurrentUserId());
        return exerciseRepository.save(exercise);
    }
}
