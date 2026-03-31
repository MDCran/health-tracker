package dev.zeroday.health.metrics.controller;

import dev.zeroday.health.metrics.dto.*;
import dev.zeroday.health.metrics.model.MetricType;
import dev.zeroday.health.metrics.service.BodyMetricService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/metrics")
@RequiredArgsConstructor
public class BodyMetricController {

    private final BodyMetricService metricService;

    @GetMapping
    public ResponseEntity<Page<BodyMetricResponse>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            Pageable pageable) {
        return ResponseEntity.ok(metricService.list(type, from, to, pageable));
    }

    @PostMapping
    public ResponseEntity<BodyMetricResponse> create(@Valid @RequestBody BodyMetricRequest request) {
        return ResponseEntity.ok(metricService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BodyMetricResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BodyMetricRequest request) {
        return ResponseEntity.ok(metricService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        metricService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/latest")
    public ResponseEntity<LatestMetricsResponse> getLatest() {
        return ResponseEntity.ok(metricService.getLatest());
    }

    @GetMapping("/trends")
    public ResponseEntity<MetricTrendResponse> getTrends(
            @RequestParam String type,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(metricService.getTrends(type, from, to));
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getTypes() {
        List<String> types = Arrays.stream(MetricType.values())
                .map(Enum::name)
                .toList();
        return ResponseEntity.ok(types);
    }
}
