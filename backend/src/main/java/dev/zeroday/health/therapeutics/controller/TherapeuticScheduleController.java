package dev.zeroday.health.therapeutics.controller;

import dev.zeroday.health.therapeutics.dto.ScheduleRequest;
import dev.zeroday.health.therapeutics.dto.ScheduleResponse;
import dev.zeroday.health.therapeutics.service.TherapeuticScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/therapeutic-schedules")
@RequiredArgsConstructor
public class TherapeuticScheduleController {

    private final TherapeuticScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> listSchedules(
            @RequestParam(name = "type", required = false) String therapeuticType) {
        List<ScheduleResponse> schedules;
        if (therapeuticType != null && !therapeuticType.isBlank()) {
            schedules = scheduleService.getActiveSchedulesByType(therapeuticType);
        } else {
            schedules = scheduleService.getActiveSchedules();
        }
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<ScheduleResponse>> getSchedulesForDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scheduleService.getSchedulesForDateRange(startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(@Valid @RequestBody ScheduleRequest request) {
        ScheduleResponse response = scheduleService.createSchedule(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScheduleResponse> getSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.getSchedule(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScheduleResponse> updateSchedule(@PathVariable Long id,
                                                            @Valid @RequestBody ScheduleRequest request) {
        return ResponseEntity.ok(scheduleService.updateSchedule(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}
