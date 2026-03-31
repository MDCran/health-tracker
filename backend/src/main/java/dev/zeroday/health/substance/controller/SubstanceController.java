package dev.zeroday.health.substance.controller;

import dev.zeroday.health.substance.dto.*;
import dev.zeroday.health.substance.service.SubstanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/substance")
@RequiredArgsConstructor
public class SubstanceController {

    private final SubstanceService substanceService;

    @PostMapping("/log")
    public ResponseEntity<SubstanceLogResponse> logOccurrence(
            @Valid @RequestBody SubstanceLogRequest request) {
        return ResponseEntity.ok(substanceService.logOccurrence(request));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<SubstanceLogResponse>> listLogs(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(substanceService.list(type, from, to));
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<SubstanceLogResponse> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(substanceService.getById(id));
    }

    @PutMapping("/logs/{id}")
    public ResponseEntity<SubstanceLogResponse> updateLog(
            @PathVariable Long id,
            @Valid @RequestBody SubstanceLogUpdateRequest request) {
        return ResponseEntity.ok(substanceService.update(id, request));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        substanceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<SubstanceStatsResponse> getStats(
            @RequestParam String type) {
        return ResponseEntity.ok(substanceService.getStats(type));
    }

    @GetMapping("/stats/all")
    public ResponseEntity<List<SubstanceStatsResponse>> getAllStats() {
        return ResponseEntity.ok(substanceService.getAllStats());
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getLoggedTypes() {
        return ResponseEntity.ok(substanceService.getLoggedTypes());
    }

    @GetMapping("/custom-types")
    public ResponseEntity<List<CustomSubstanceTypeResponse>> getCustomTypes() {
        return ResponseEntity.ok(substanceService.getCustomTypes());
    }

    @PostMapping("/custom-types")
    public ResponseEntity<CustomSubstanceTypeResponse> createCustomType(
            @Valid @RequestBody CustomSubstanceTypeRequest request) {
        return ResponseEntity.ok(substanceService.createCustomType(request));
    }

    @DeleteMapping("/custom-types/{id}")
    public ResponseEntity<Void> deleteCustomType(@PathVariable Long id) {
        substanceService.deleteCustomType(id);
        return ResponseEntity.noContent().build();
    }
}
