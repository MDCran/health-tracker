package dev.zeroday.health.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
@AllArgsConstructor
public class CalendarEventResponse {
    private String eventType;
    private String category;
    private Long referenceId;
    private String title;
    private String subtitle;
    private LocalDate date;
    private LocalTime time;
    private boolean completed;
    private String color;
}
