package dev.zeroday.health.calendar.service;

import dev.zeroday.health.calendar.dto.CalendarDayResponse;
import dev.zeroday.health.calendar.dto.CalendarEventResponse;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final JdbcTemplate jdbc;
    private final UserService userService;

    public List<CalendarDayResponse> getEventsForRange(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        List<CalendarEventResponse> allEvents = new ArrayList<>();

        allEvents.addAll(getTherapeuticEvents(userId, from, to));
        allEvents.addAll(getWorkoutEvents(userId, from, to));
        allEvents.addAll(getHabitEvents(userId, from, to));

        Map<LocalDate, List<CalendarEventResponse>> byDate = allEvents.stream()
                .collect(Collectors.groupingBy(CalendarEventResponse::getDate));

        List<CalendarDayResponse> days = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<CalendarEventResponse> dayEvents = byDate.getOrDefault(d, List.of());
            long completed = dayEvents.stream().filter(CalendarEventResponse::isCompleted).count();
            days.add(new CalendarDayResponse(d, dayEvents, dayEvents.size(), (int) completed));
        }
        return days;
    }

    public CalendarDayResponse getEventsForDate(LocalDate date) {
        List<CalendarDayResponse> range = getEventsForRange(date, date);
        return range.isEmpty() ? new CalendarDayResponse(date, List.of(), 0, 0) : range.get(0);
    }

    private List<CalendarEventResponse> getTherapeuticEvents(Long userId, LocalDate from, LocalDate to) {
        List<CalendarEventResponse> events = new ArrayList<>();

        List<Map<String, Object>> schedules = jdbc.queryForList(
                "SELECT ts.*, " +
                "CASE ts.therapeutic_type " +
                "  WHEN 'PEPTIDE' THEN (SELECT name FROM peptide WHERE id = ts.therapeutic_id) " +
                "  WHEN 'MEDICATION' THEN (SELECT name FROM medication WHERE id = ts.therapeutic_id) " +
                "  WHEN 'SUPPLEMENT' THEN (SELECT name FROM supplement WHERE id = ts.therapeutic_id) " +
                "END as therapeutic_name " +
                "FROM therapeutic_schedule ts " +
                "WHERE ts.user_id = ? AND ts.active = true " +
                "AND ts.start_date <= ? AND (ts.end_date IS NULL OR ts.end_date >= ?)",
                userId, to, from);

        Map<String, String> typeColors = Map.of(
                "PEPTIDE", "purple", "MEDICATION", "blue", "SUPPLEMENT", "green");

        for (Map<String, Object> schedule : schedules) {
            String type = (String) schedule.get("therapeutic_type");
            String name = (String) schedule.get("therapeutic_name");
            Long scheduleId = ((Number) schedule.get("id")).longValue();
            Long therapeuticId = ((Number) schedule.get("therapeutic_id")).longValue();
            LocalTime time = schedule.get("time_of_day") != null ?
                    ((java.sql.Time) schedule.get("time_of_day")).toLocalTime() : null;

            Object daysObj = schedule.get("days_of_week");
            List<Integer> days = daysObj != null ? arrayToList(daysObj) : List.of();

            Set<LocalDate> loggedDates = getLoggedDates(userId, type, therapeuticId, from, to);

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                boolean scheduled = shouldOccur(schedule, d, days);
                if (scheduled) {
                    events.add(CalendarEventResponse.builder()
                            .eventType("THERAPEUTIC")
                            .category(type)
                            .referenceId(therapeuticId)
                            .title(name != null ? name : "Unknown")
                            .subtitle(type.toLowerCase())
                            .date(d)
                            .time(time)
                            .completed(loggedDates.contains(d))
                            .color(typeColors.getOrDefault(type, "gray"))
                            .build());
                }
            }
        }
        return events;
    }

    private boolean shouldOccur(Map<String, Object> schedule, LocalDate date, List<Integer> daysOfWeek) {
        String scheduleType = (String) schedule.get("schedule_type");
        if ("DAILY".equals(scheduleType)) return true;
        if ("SPECIFIC_DAYS".equals(scheduleType) && !daysOfWeek.isEmpty()) {
            return daysOfWeek.contains(date.getDayOfWeek().getValue());
        }
        if ("INTERVAL".equals(scheduleType)) {
            Object intervalObj = schedule.get("interval_days");
            if (intervalObj != null) {
                int interval = ((Number) intervalObj).intValue();
                LocalDate start = ((java.sql.Date) schedule.get("start_date")).toLocalDate();
                long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(start, date);
                return daysBetween >= 0 && daysBetween % interval == 0;
            }
        }
        return false;
    }

    private Set<LocalDate> getLoggedDates(Long userId, String type, Long therapeuticId,
                                           LocalDate from, LocalDate to) {
        return new HashSet<>(jdbc.queryForList(
                "SELECT DATE(taken_at) FROM therapeutic_log " +
                "WHERE user_id = ? AND therapeutic_type = ? AND therapeutic_id = ? " +
                "AND taken_at >= ?::date AND taken_at < (?::date + interval '1 day') AND skipped = false",
                LocalDate.class, userId, type, therapeuticId, from, to));
    }

    private List<CalendarEventResponse> getWorkoutEvents(Long userId, LocalDate from, LocalDate to) {
        List<CalendarEventResponse> events = new ArrayList<>();

        List<Map<String, Object>> schedules = jdbc.queryForList(
                "SELECT ws.*, wt.name as template_name FROM workout_schedule ws " +
                "JOIN workout_template wt ON wt.id = ws.template_id " +
                "WHERE ws.user_id = ? AND ws.active = true " +
                "AND ws.start_date <= ? AND (ws.end_date IS NULL OR ws.end_date >= ?)",
                userId, to, from);

        Set<LocalDate> sessionDates = new HashSet<>(jdbc.queryForList(
                "SELECT date FROM workout_session WHERE user_id = ? AND date BETWEEN ? AND ?",
                LocalDate.class, userId, from, to));

        for (Map<String, Object> schedule : schedules) {
            String name = (String) schedule.get("template_name");
            Long templateId = ((Number) schedule.get("template_id")).longValue();
            Object daysObj = schedule.get("days_of_week");
            List<Integer> days = daysObj != null ? arrayToList(daysObj) : List.of();

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (!days.isEmpty() && days.contains(d.getDayOfWeek().getValue())) {
                    events.add(CalendarEventResponse.builder()
                            .eventType("WORKOUT")
                            .category("SCHEDULED")
                            .referenceId(templateId)
                            .title(name)
                            .subtitle("workout")
                            .date(d)
                            .completed(sessionDates.contains(d))
                            .color("orange")
                            .build());
                }
            }
        }

        jdbc.queryForList(
                "SELECT id, name, date FROM workout_session " +
                "WHERE user_id = ? AND date BETWEEN ? AND ? AND template_id IS NULL",
                userId, from, to)
                .forEach(row -> events.add(CalendarEventResponse.builder()
                        .eventType("WORKOUT")
                        .category("ADHOC")
                        .referenceId(((Number) row.get("id")).longValue())
                        .title((String) row.get("name"))
                        .subtitle("workout")
                        .date(((java.sql.Date) row.get("date")).toLocalDate())
                        .completed(true)
                        .color("orange")
                        .build()));

        return events;
    }

    private List<CalendarEventResponse> getHabitEvents(Long userId, LocalDate from, LocalDate to) {
        List<CalendarEventResponse> events = new ArrayList<>();

        List<Map<String, Object>> habits = jdbc.queryForList(
                "SELECT id, name, frequency, days_of_week, color FROM habit " +
                "WHERE user_id = ? AND active = true", userId);

        for (Map<String, Object> habit : habits) {
            Long habitId = ((Number) habit.get("id")).longValue();
            String name = (String) habit.get("name");
            String color = habit.get("color") != null ? (String) habit.get("color") : "teal";
            String frequency = (String) habit.get("frequency");
            Object daysObj = habit.get("days_of_week");
            List<Integer> days = daysObj != null ? arrayToList(daysObj) : List.of();

            Set<LocalDate> completedDates = new HashSet<>(jdbc.queryForList(
                    "SELECT date FROM habit_log WHERE habit_id = ? AND date BETWEEN ? AND ? AND completed = true",
                    LocalDate.class, habitId, from, to));

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                boolean applies = "DAILY".equals(frequency) ||
                        (!days.isEmpty() && days.contains(d.getDayOfWeek().getValue()));
                if (applies) {
                    events.add(CalendarEventResponse.builder()
                            .eventType("HABIT")
                            .category("HABIT")
                            .referenceId(habitId)
                            .title(name)
                            .subtitle("habit")
                            .date(d)
                            .completed(completedDates.contains(d))
                            .color(color)
                            .build());
                }
            }
        }
        return events;
    }

    @SuppressWarnings("unchecked")
    private List<Integer> arrayToList(Object pgArray) {
        try {
            if (pgArray instanceof java.sql.Array sqlArray) {
                Integer[] arr = (Integer[]) sqlArray.getArray();
                return Arrays.asList(arr);
            }
            return List.of();
        } catch (Exception e) {
            return List.of();
        }
    }
}
