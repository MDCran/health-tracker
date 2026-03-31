package dev.zeroday.health.substance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubstanceStatsResponse {

    private String substanceType;
    private long daysSinceLast;
    private long totalOccurrences;
    private long occurrencesThisWeek;
    private long occurrencesThisMonth;
    private double avgMoodBefore;
    private double avgMoodAfter;
    private long longestCleanStreak;
    private long currentCleanStreak;
    private List<WeeklyCount> weeklyTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyCount {
        private String week;
        private long count;
    }
}
