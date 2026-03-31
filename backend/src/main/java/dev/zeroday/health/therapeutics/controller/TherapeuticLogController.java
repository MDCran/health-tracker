package dev.zeroday.health.therapeutics.controller;

import dev.zeroday.health.therapeutics.dto.TherapeuticLogRequest;
import dev.zeroday.health.therapeutics.dto.TherapeuticLogResponse;
import dev.zeroday.health.therapeutics.service.TherapeuticLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/therapeutic-logs")
@RequiredArgsConstructor
public class TherapeuticLogController {

    private final TherapeuticLogService logService;

    @GetMapping
    public ResponseEntity<List<TherapeuticLogResponse>> listLogs(
            @RequestParam Instant start,
            @RequestParam Instant end,
            @RequestParam(name = "type", required = false) String therapeuticType) {
        List<TherapeuticLogResponse> logs;
        if (therapeuticType != null && !therapeuticType.isBlank()) {
            logs = logService.getLogsByType(therapeuticType, start, end);
        } else {
            logs = logService.getLogs(start, end);
        }
        return ResponseEntity.ok(logs);
    }

    @PostMapping
    public ResponseEntity<TherapeuticLogResponse> createLog(@Valid @RequestBody TherapeuticLogRequest request) {
        TherapeuticLogResponse response = logService.createLog(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TherapeuticLogResponse> updateLog(@PathVariable Long id,
                                                             @Valid @RequestBody TherapeuticLogRequest request) {
        return ResponseEntity.ok(logService.updateLog(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        logService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }
}
