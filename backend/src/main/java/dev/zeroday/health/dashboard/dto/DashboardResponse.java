package dev.zeroday.health.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Builder
public class DashboardResponse {
    private WorkoutSummary workouts;
    private NutritionSummary nutrition;
    private JournalSummary journal;
    private HabitSummary habits;
    private TherapeuticSummary therapeutics;
    private MetricSummary metrics;

    @Getter
    @Builder
    public static class WorkoutSummary {
        private int totalSessions;
        private int totalExercises;
        private int totalSets;
        private BigDecimal totalVolumeKg;
        private int newPrs;
        private List<Map<String, Object>> frequencyByDay;
    }

    @Getter
    @Builder
    public static class NutritionSummary {
        private BigDecimal avgCalories;
        private BigDecimal avgProteinG;
        private BigDecimal avgCarbsG;
        private BigDecimal avgFatG;
        private int daysLogged;
        private List<Map<String, Object>> dailyCalories;
    }

    @Getter
    @Builder
    public static class JournalSummary {
        private BigDecimal avgOverallRating;
        private Map<String, BigDecimal> realmAverages;
        private int entriesCount;
        private List<Map<String, Object>> ratingTrend;
    }

    @Getter
    @Builder
    public static class HabitSummary {
        private int activeHabits;
        private BigDecimal overallCompletionRate;
        private int longestStreak;
        private List<Map<String, Object>> topHabits;
    }

    @Getter
    @Builder
    public static class TherapeuticSummary {
        private int activePeptides;
        private int activeMedications;
        private int activeSupplements;
        private BigDecimal adherenceRate;
        private int scheduledCount;
        private int completedCount;
    }

    @Getter
    @Builder
    public static class MetricSummary {
        private BigDecimal currentWeight;
        private BigDecimal weightChange;
        private List<Map<String, Object>> weightTrend;
    }
}
