package dev.zeroday.health.sleep.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class SleepEntryRequest {

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Bedtime is required")
    private Instant bedtime;

    @NotNull(message = "Wake time is required")
    private Instant wakeTime;

    @Min(1) @Max(10)
    private Integer sleepQuality;

    @Min(1) @Max(5)
    private Integer feelRested;

    @Min(0)
    private Integer sleepLatencyMin;

    private String notes;

    private Map<String, Object> surveyResponses;

    private List<InterruptionRequest> interruptions;

    @Data
    public static class InterruptionRequest {

        @NotNull(message = "Woke at time is required")
        private Instant wokeAt;

        private Instant fellBackAt;

        private String reason;
    }
}
