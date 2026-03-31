package dev.zeroday.health.insights.controller;

import dev.zeroday.health.insights.dto.InsightResponse;
import dev.zeroday.health.insights.service.InsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
@RequiredArgsConstructor
public class InsightsController {

    private final InsightsService insightsService;

    @GetMapping
    public ResponseEntity<InsightResponse> getInsights() {
        return ResponseEntity.ok(insightsService.generateInsights());
    }
}
