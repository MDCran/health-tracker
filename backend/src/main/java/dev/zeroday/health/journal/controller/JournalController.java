package dev.zeroday.health.journal.controller;

import dev.zeroday.health.journal.dto.JournalEntryRequest;
import dev.zeroday.health.journal.dto.JournalEntryResponse;
import dev.zeroday.health.journal.dto.RealmAverageResponse;
import dev.zeroday.health.journal.service.JournalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Pageable pageable) {
        if (from != null && to != null) {
            return ResponseEntity.ok(journalService.listBetween(from, to));
        }
        return ResponseEntity.ok(journalService.list(pageable));
    }

    @PostMapping
    public ResponseEntity<JournalEntryResponse> create(@Valid @RequestBody JournalEntryRequest request) {
        return ResponseEntity.ok(journalService.createOrUpdate(request));
    }

    @GetMapping("/{date}")
    public ResponseEntity<JournalEntryResponse> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(journalService.getByDate(date));
    }

    @PutMapping("/{date}")
    public ResponseEntity<JournalEntryResponse> update(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody JournalEntryRequest request) {
        request.setDate(date);
        return ResponseEntity.ok(journalService.createOrUpdate(request));
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> delete(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        journalService.delete(date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/realm-averages")
    public ResponseEntity<List<RealmAverageResponse>> getRealmAverages(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(journalService.getRealmAverages(from, to));
    }
}
