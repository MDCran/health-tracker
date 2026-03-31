package dev.zeroday.health.habits.controller;

import dev.zeroday.health.habits.dto.*;
import dev.zeroday.health.habits.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<HabitResponse>> listHabits(
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(habitService.listHabits(activeOnly));
    }

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@Valid @RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.createHabit(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HabitResponse> getHabit(@PathVariable Long id) {
        return ResponseEntity.ok(habitService.getHabit(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> updateHabit(
            @PathVariable Long id,
            @Valid @RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.updateHabit(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(@PathVariable Long id) {
        habitService.deleteHabit(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/log")
    public ResponseEntity<HabitLogResponse> logCompletion(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String notes) {
        LocalDate logDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(habitService.logCompletion(id, logDate, notes));
    }

    @DeleteMapping("/{id}/log/{date}")
    public ResponseEntity<Void> removeLog(
            @PathVariable Long id,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        habitService.removeLog(id, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<HabitLogResponse>> getHistory(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(habitService.getHistory(id, from, to));
    }

    @GetMapping("/daily-status")
    public ResponseEntity<List<DailyHabitStatusResponse>> getDailyStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate statusDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(habitService.getDailyStatus(statusDate));
    }

    @GetMapping("/{id}/milestones")
    public ResponseEntity<List<HabitMilestoneResponse>> getMilestones(@PathVariable Long id) {
        return ResponseEntity.ok(habitService.getMilestones(id));
    }
}
