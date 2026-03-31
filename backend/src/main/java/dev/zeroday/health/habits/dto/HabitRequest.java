package dev.zeroday.health.habits.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
public class HabitRequest {

    @NotBlank(message = "Habit name is required")
    private String name;

    private String description;

    @NotBlank(message = "Frequency is required")
    private String frequency;

    private Integer targetCount;
    private List<Integer> daysOfWeek;
    private String color;
    private String icon;
    private String habitType;
    private Integer targetDays;
    private String category;
    private String cue;
    private String routine;
    private String reward;
    private Long stackAfterHabitId;
    private String difficulty;
    private Integer priority;
    private LocalTime reminderTime;
    private Boolean active;
}
