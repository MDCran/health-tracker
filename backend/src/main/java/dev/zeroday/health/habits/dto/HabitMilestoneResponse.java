package dev.zeroday.health.habits.dto;

import dev.zeroday.health.habits.model.HabitMilestone;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitMilestoneResponse {

    private Long id;
    private Long habitId;
    private String milestoneType;
    private int milestoneValue;
    private LocalDate achievedAt;

    public static HabitMilestoneResponse from(HabitMilestone milestone) {
        return HabitMilestoneResponse.builder()
                .id(milestone.getId())
                .habitId(milestone.getHabitId())
                .milestoneType(milestone.getMilestoneType())
                .milestoneValue(milestone.getMilestoneValue())
                .achievedAt(milestone.getAchievedAt())
                .build();
    }
}
