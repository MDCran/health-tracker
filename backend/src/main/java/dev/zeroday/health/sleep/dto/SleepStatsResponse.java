package dev.zeroday.health.sleep.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SleepStatsResponse {

    private double avgSleepHours;
    private double avgQuality;
    private double avgInterruptions;
    private double avgLatency;
    private List<DataPoint> dataPoints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        private String date;
        private double hours;
        private int quality;
    }
}
