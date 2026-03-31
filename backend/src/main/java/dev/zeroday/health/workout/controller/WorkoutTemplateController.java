package dev.zeroday.health.workout.controller;

import dev.zeroday.health.workout.dto.WorkoutScheduleRequest;
import dev.zeroday.health.workout.dto.WorkoutScheduleResponse;
import dev.zeroday.health.workout.dto.WorkoutTemplateRequest;
import dev.zeroday.health.workout.dto.WorkoutTemplateResponse;
import dev.zeroday.health.workout.service.WorkoutTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workout-templates")
@RequiredArgsConstructor
public class WorkoutTemplateController {

    private final WorkoutTemplateService templateService;

    @GetMapping
    public ResponseEntity<List<WorkoutTemplateResponse>> list() {
        return ResponseEntity.ok(templateService.listTemplates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutTemplateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.getTemplate(id));
    }

    @PostMapping
    public ResponseEntity<WorkoutTemplateResponse> create(@Valid @RequestBody WorkoutTemplateRequest request) {
        return ResponseEntity.ok(templateService.createTemplate(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkoutTemplateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutTemplateRequest request) {
        return ResponseEntity.ok(templateService.updateTemplate(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<List<WorkoutScheduleResponse>> getSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.getSchedules(id));
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<WorkoutScheduleResponse> createSchedule(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutScheduleRequest request) {
        return ResponseEntity.ok(templateService.createSchedule(id, request));
    }
}
