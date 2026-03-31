package dev.zeroday.health.sleep.dto;

import dev.zeroday.health.sleep.model.SleepEntry;
import dev.zeroday.health.sleep.model.SleepInterruption;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SleepEntryResponse {

    private Long id;
    private LocalDate date;
    private Instant bedtime;
    private Instant wakeTime;
    private Integer totalMinutes;
    private Integer sleepQuality;
    private Integer feelRested;
    private Integer sleepLatencyMin;
    private String notes;
    private Map<String, Object> surveyResponses;
    private List<InterruptionResponse> interruptions;
    private double totalHours;
    private long timeInBed;
    private int interruptionCount;
    private Map<String, Integer> estimatedSleepStages;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterruptionResponse {
        private Long id;
        private Instant wokeAt;
        private Instant fellBackAt;
        private Integer durationMin;
        private String reason;
    }

    public static SleepEntryResponse from(SleepEntry entry, Map<String, Object> parsedSurvey, Map<String, Integer> sleepStages) {
        int interruptionMinutes = 0;
        List<InterruptionResponse> interruptionResponses = List.of();

        if (entry.getInterruptions() != null && !entry.getInterruptions().isEmpty()) {
            interruptionResponses = entry.getInterruptions().stream()
                    .map(i -> InterruptionResponse.builder()
                            .id(i.getId())
                            .wokeAt(i.getWokeAt())
                            .fellBackAt(i.getFellBackAt())
                            .durationMin(i.getDurationMin())
                            .reason(i.getReason())
                            .build())
                    .toList();

            interruptionMinutes = entry.getInterruptions().stream()
                    .mapToInt(i -> i.getDurationMin() != null ? i.getDurationMin() : 0)
                    .sum();
        }

        int totalMin = entry.getTotalMinutes() != null ? entry.getTotalMinutes() : 0;
        long timeInBedMin = Duration.between(entry.getBedtime(), entry.getWakeTime()).toMinutes();

        return SleepEntryResponse.builder()
                .id(entry.getId())
                .date(entry.getDate())
                .bedtime(entry.getBedtime())
                .wakeTime(entry.getWakeTime())
                .totalMinutes(entry.getTotalMinutes())
                .sleepQuality(entry.getSleepQuality())
                .feelRested(entry.getFeelRested())
                .sleepLatencyMin(entry.getSleepLatencyMin())
                .notes(entry.getNotes())
                .surveyResponses(parsedSurvey)
                .interruptions(interruptionResponses)
                .totalHours(Math.round(totalMin / 60.0 * 100.0) / 100.0)
                .timeInBed(timeInBedMin)
                .interruptionCount(interruptionResponses.size())
                .estimatedSleepStages(sleepStages)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
