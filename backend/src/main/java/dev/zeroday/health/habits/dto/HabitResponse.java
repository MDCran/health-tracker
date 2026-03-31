package dev.zeroday.health.habits.dto;

import dev.zeroday.health.habits.model.Habit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitResponse {

    private Long id;
    private String name;
    private String description;
    private String frequency;
    private Integer targetCount;
    private List<Integer> daysOfWeek;
    private String color;
    private String icon;
    private boolean active;
    private String habitType;
    private int targetDays;
    private String category;
    private String cue;
    private String routine;
    private String reward;
    private Long stackAfterHabitId;
    private String difficulty;
    private Integer priority;
    private int currentStreak;
    private int longestStreak;
    private double completionRate;
    private int daysSinceLastOccurrence;
    private int totalOccurrences;
    private double formationProgress;
    private Instant createdAt;
    private Instant updatedAt;

    public static HabitResponse from(Habit habit, int currentStreak, int longestStreak, double completionRate) {
        return from(habit, currentStreak, longestStreak, completionRate, -1, 0);
    }

    public static HabitResponse from(Habit habit, int currentStreak, int longestStreak, double completionRate,
                                     int daysSinceLastOccurrence, int totalOccurrences) {
        boolean isBad = "BAD".equals(habit.getHabitType());
        int streakForProgress = isBad ? daysSinceLastOccurrence : currentStreak;
        double progress = habit.getTargetDays() > 0 && streakForProgress >= 0
                ? Math.min(100.0, (streakForProgress * 100.0) / habit.getTargetDays())
                : 0.0;

        return HabitResponse.builder()
                .id(habit.getId())
                .name(habit.getName())
                .description(habit.getDescription())
                .frequency(habit.getFrequency())
                .targetCount(habit.getTargetCount())
                .daysOfWeek(habit.getDaysOfWeek())
                .color(habit.getColor())
                .icon(habit.getIcon())
                .active(habit.isActive())
                .habitType(habit.getHabitType())
                .targetDays(habit.getTargetDays())
                .category(habit.getCategory())
                .cue(habit.getCue())
                .routine(habit.getRoutine())
                .reward(habit.getReward())
                .stackAfterHabitId(habit.getStackAfterHabitId())
                .difficulty(habit.getDifficulty())
                .priority(habit.getPriority())
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .completionRate(completionRate)
                .daysSinceLastOccurrence(daysSinceLastOccurrence)
                .totalOccurrences(totalOccurrences)
                .formationProgress(progress)
                .createdAt(habit.getCreatedAt())
                .updatedAt(habit.getUpdatedAt())
                .build();
    }
}
