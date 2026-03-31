package dev.zeroday.health.habits.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyHabitStatusResponse {

    private Long habitId;
    private String habitName;
    private String habitType;
    private boolean completed;
    private int currentStreak;
    private int daysSinceLastOccurrence;
    private double formationProgress;
    private int targetDays;
    private String color;
}
