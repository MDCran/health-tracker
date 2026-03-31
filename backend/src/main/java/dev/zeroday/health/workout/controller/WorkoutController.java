package dev.zeroday.health.workout.controller;

import dev.zeroday.health.workout.dto.*;
import dev.zeroday.health.workout.service.WorkoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    @GetMapping
    public ResponseEntity<Page<WorkoutSessionResponse>> list(Pageable pageable) {
        return ResponseEntity.ok(workoutService.listSessions(pageable));
    }

    @PostMapping
    public ResponseEntity<WorkoutSessionResponse> create(@Valid @RequestBody WorkoutSessionRequest request) {
        return ResponseEntity.ok(workoutService.createSession(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutSessionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(workoutService.getSessionWithDetails(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkoutSessionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutSessionRequest request) {
        return ResponseEntity.ok(workoutService.updateSession(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workoutService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<WorkoutSessionResponse> start(@PathVariable Long id) {
        return ResponseEntity.ok(workoutService.startSession(id));
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<WorkoutSessionResponse> finish(@PathVariable Long id) {
        return ResponseEntity.ok(workoutService.finishSession(id));
    }

    @PostMapping("/{id}/exercises")
    public ResponseEntity<WorkoutExerciseResponse> addExercise(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutExerciseRequest request) {
        return ResponseEntity.ok(workoutService.addExercise(id, request));
    }

    @PutMapping("/{id}/exercises/{exId}")
    public ResponseEntity<WorkoutExerciseResponse> updateExercise(
            @PathVariable Long id,
            @PathVariable Long exId,
            @Valid @RequestBody WorkoutExerciseRequest request) {
        return ResponseEntity.ok(workoutService.updateExercise(id, exId, request));
    }

    @DeleteMapping("/{id}/exercises/{exId}")
    public ResponseEntity<Void> deleteExercise(
            @PathVariable Long id,
            @PathVariable Long exId) {
        workoutService.deleteExercise(id, exId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/exercises/{exId}/sets")
    public ResponseEntity<ExerciseSetResponse> addSet(
            @PathVariable Long id,
            @PathVariable Long exId,
            @Valid @RequestBody ExerciseSetRequest request) {
        return ResponseEntity.ok(workoutService.addSet(id, exId, request));
    }

    @PutMapping("/{id}/exercises/{exId}/sets/{setId}")
    public ResponseEntity<ExerciseSetResponse> updateSet(
            @PathVariable Long id,
            @PathVariable Long exId,
            @PathVariable Long setId,
            @Valid @RequestBody ExerciseSetRequest request) {
        return ResponseEntity.ok(workoutService.updateSet(id, exId, setId, request));
    }

    @DeleteMapping("/{id}/exercises/{exId}/sets/{setId}")
    public ResponseEntity<Void> deleteSet(
            @PathVariable Long id,
            @PathVariable Long exId,
            @PathVariable Long setId) {
        workoutService.deleteSet(id, exId, setId);
        return ResponseEntity.noContent().build();
    }
}
