package dev.zeroday.health.metrics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LatestMetricsResponse {

    private Map<String, LatestValue> metrics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LatestValue {
        private BigDecimal value;
        private String unit;
        private Instant measuredAt;
    }
}
