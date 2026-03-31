package dev.zeroday.health.therapeutics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class ScheduleRequest {

    @NotBlank(message = "Therapeutic type is required")
    private String therapeuticType;

    @NotNull(message = "Therapeutic ID is required")
    private Long therapeuticId;

    private String scheduleType;
    private List<Integer> daysOfWeek;
    private Integer intervalDays;
    private LocalTime timeOfDay;
    private BigDecimal dosageOverride;
    private String dosageUnit;
    private String notes;
    private LocalDate startDate;
    private LocalDate endDate;
}
