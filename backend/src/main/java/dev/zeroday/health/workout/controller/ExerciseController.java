package dev.zeroday.health.workout.controller;

import dev.zeroday.health.workout.dto.ExerciseResponse;
import dev.zeroday.health.workout.model.Exercise;
import dev.zeroday.health.workout.model.ExerciseCategory;
import dev.zeroday.health.workout.model.MuscleGroup;
import dev.zeroday.health.workout.service.ExerciseService;
import dev.zeroday.health.workout.service.ExerciseSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;
    private final ExerciseSyncService exerciseSyncService;
    private final JdbcTemplate jdbc;
    private final dev.zeroday.health.user.UserService userService;

    @GetMapping
    public ResponseEntity<List<ExerciseResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String muscle) {

        List<ExerciseResponse> results = exerciseService.search(q, category, muscle).stream()
                .map(ExerciseResponse::from)
                .toList();

        return ResponseEntity.ok(results);
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<List<ExerciseResponse>> autocomplete(@RequestParam String q) {
        List<ExerciseResponse> results = exerciseService.autocomplete(q).stream()
                .map(ExerciseResponse::from)
                .toList();

        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseResponse> getById(@PathVariable Long id) {
        Exercise exercise = exerciseService.getById(id);
        return ResponseEntity.ok(ExerciseResponse.from(exercise));
    }

    @PostMapping
    public ResponseEntity<ExerciseResponse> createCustom(@Valid @RequestBody Exercise exercise) {
        Exercise saved = exerciseService.createCustom(exercise);
        return ResponseEntity.ok(ExerciseResponse.from(saved));
    }

    @GetMapping("/muscle-groups")
    public ResponseEntity<List<String>> getMuscleGroups() {
        List<String> groups = Arrays.stream(MuscleGroup.values())
                .map(MuscleGroup::name)
                .toList();
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = Arrays.stream(ExerciseCategory.values())
                .map(ExerciseCategory::name)
                .toList();
        return ResponseEntity.ok(categories);
    }


    @GetMapping("/{id}/history")
    public ResponseEntity<List<Map<String, Object>>> getExerciseHistory(@PathVariable Long id) {
        Long userId = userService.getCurrentUserId();
        List<Map<String, Object>> history = jdbc.queryForList(
                "SELECT ws.date, ws.name as workout_name, es.set_number, es.weight_kg, es.reps, " +
                "es.duration_seconds, es.set_type, es.rpe " +
                "FROM exercise_set es " +
                "JOIN workout_exercise we ON we.id = es.workout_exercise_id " +
                "JOIN workout_session ws ON ws.id = we.session_id " +
                "WHERE we.exercise_id = ? AND ws.user_id = ? AND es.completed = true " +
                "ORDER BY ws.date DESC, es.set_number " +
                "LIMIT 50",
                id, userId);
        return ResponseEntity.ok(history);
    }


    @GetMapping("/{id}/last-session")
    public ResponseEntity<Map<String, Object>> getLastSession(@PathVariable Long id) {
        Long userId = userService.getCurrentUserId();
        List<Map<String, Object>> sets = jdbc.queryForList(
                "SELECT es.set_number, es.weight_kg, es.reps, es.duration_seconds, es.set_type, es.rpe, ws.date " +
                "FROM exercise_set es " +
                "JOIN workout_exercise we ON we.id = es.workout_exercise_id " +
                "JOIN workout_session ws ON ws.id = we.session_id " +
                "WHERE we.exercise_id = ? AND ws.user_id = ? AND es.completed = true " +
                "AND ws.date = (SELECT MAX(ws2.date) FROM workout_session ws2 " +
                "  JOIN workout_exercise we2 ON we2.session_id = ws2.id " +
                "  WHERE we2.exercise_id = ? AND ws2.user_id = ?) " +
                "ORDER BY es.set_number",
                id, userId, id, userId);

        List<Map<String, Object>> prs = jdbc.queryForList(
                "SELECT record_type, value, unit, achieved_at FROM personal_record " +
                "WHERE user_id = ? AND exercise_id = ? ORDER BY record_type",
                userId, id);

        Map<String, Object> result = new HashMap<>();
        result.put("lastSets", sets);
        result.put("personalRecords", prs);
        if (!sets.isEmpty()) {
            result.put("lastDate", sets.get(0).get("date"));
        }
        return ResponseEntity.ok(result);
    }


    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncExternalExercises() {
        Map<String, Object> results = new HashMap<>();
        results.put("exerciseDb", exerciseSyncService.syncExerciseDb());
        results.put("muscleWiki", exerciseSyncService.syncMuscleWiki());
        return ResponseEntity.ok(results);
    }
}
