package dev.zeroday.health.therapeutics.dto;

import dev.zeroday.health.therapeutics.model.TherapeuticSchedule;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ScheduleResponse {

    private Long id;
    private String therapeuticType;
    private Long therapeuticId;
    private String scheduleType;
    private List<Integer> daysOfWeek;
    private Integer intervalDays;
    private LocalTime timeOfDay;
    private BigDecimal dosageOverride;
    private String dosageUnit;
    private String notes;
    private boolean active;
    private LocalDate startDate;
    private LocalDate endDate;
    private Instant createdAt;
    private Instant updatedAt;

    public static ScheduleResponse from(TherapeuticSchedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getTherapeuticType(),
                schedule.getTherapeuticId(),
                schedule.getScheduleType(),
                schedule.getDaysOfWeek(),
                schedule.getIntervalDays(),
                schedule.getTimeOfDay(),
                schedule.getDosageOverride(),
                schedule.getDosageUnit(),
                schedule.getNotes(),
                schedule.isActive(),
                schedule.getStartDate(),
                schedule.getEndDate(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
}
