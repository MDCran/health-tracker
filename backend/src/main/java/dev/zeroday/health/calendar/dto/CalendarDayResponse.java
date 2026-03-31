package dev.zeroday.health.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class CalendarDayResponse {
    private LocalDate date;
    private List<CalendarEventResponse> events;
    private int totalScheduled;
    private int totalCompleted;
}
