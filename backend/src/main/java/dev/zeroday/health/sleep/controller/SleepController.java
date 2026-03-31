package dev.zeroday.health.sleep.controller;

import dev.zeroday.health.sleep.dto.SleepEntryRequest;
import dev.zeroday.health.sleep.dto.SleepEntryResponse;
import dev.zeroday.health.sleep.dto.SleepStatsResponse;
import dev.zeroday.health.sleep.service.SleepService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/sleep")
@RequiredArgsConstructor
public class SleepController {

    private final SleepService sleepService;

    @GetMapping("/entries")
    public ResponseEntity<?> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Pageable pageable) {
        if (from != null && to != null) {
            return ResponseEntity.ok(sleepService.listBetween(from, to));
        }
        return ResponseEntity.ok(sleepService.list(pageable));
    }

    @GetMapping("/entries/{date}")
    public ResponseEntity<SleepEntryResponse> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(sleepService.getByDate(date));
    }

    @PostMapping("/entries")
    public ResponseEntity<SleepEntryResponse> create(@Valid @RequestBody SleepEntryRequest request) {
        return ResponseEntity.ok(sleepService.createOrUpdateEntry(request));
    }

    @DeleteMapping("/entries/{date}")
    public ResponseEntity<Void> delete(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        sleepService.delete(date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<SleepStatsResponse> getStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(sleepService.getStats(from, to));
    }
}
