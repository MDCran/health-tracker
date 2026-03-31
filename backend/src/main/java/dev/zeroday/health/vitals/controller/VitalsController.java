package dev.zeroday.health.vitals.controller;

import dev.zeroday.health.vitals.dto.VitalReadingRequest;
import dev.zeroday.health.vitals.dto.VitalReadingResponse;
import dev.zeroday.health.vitals.service.VitalsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/vitals")
@RequiredArgsConstructor
public class VitalsController {

    private final VitalsService vitalsService;

    @GetMapping
    public ResponseEntity<List<VitalReadingResponse>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(vitalsService.list(type, from, to));
    }

    @PostMapping
    public ResponseEntity<VitalReadingResponse> create(@Valid @RequestBody VitalReadingRequest request) {
        return ResponseEntity.ok(vitalsService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vitalsService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, VitalReadingResponse>> getLatest() {
        return ResponseEntity.ok(vitalsService.getLatest());
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getTypes() {
        return ResponseEntity.ok(vitalsService.getLoggedTypes());
    }
}
