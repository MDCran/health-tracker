package dev.zeroday.health.habits.dto;

import dev.zeroday.health.habits.model.HabitLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitLogResponse {

    private Long id;
    private LocalDate date;
    private boolean completed;
    private String notes;

    public static HabitLogResponse from(HabitLog log) {
        return HabitLogResponse.builder()
                .id(log.getId())
                .date(log.getDate())
                .completed(log.isCompleted())
                .notes(log.getNotes())
                .build();
    }
}
