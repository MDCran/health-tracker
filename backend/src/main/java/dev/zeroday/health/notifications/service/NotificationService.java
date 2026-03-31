package dev.zeroday.health.notifications.service;

import dev.zeroday.health.notifications.dto.NotificationResponse;
import dev.zeroday.health.notifications.model.Notification;
import dev.zeroday.health.notifications.repository.NotificationRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications() {
        Long userId = userService.getCurrentUserId();
        return notificationRepository
                .findByUserIdAndDismissedFalseAndScheduledForBeforeOrderByScheduledForDesc(userId, Instant.now())
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long userId = userService.getCurrentUserId();
        return notificationRepository
                .countByUserIdAndReadFalseAndDismissedFalseAndScheduledForBefore(userId, Instant.now());
    }

    @Transactional
    public void markRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllRead() {
        Long userId = userService.getCurrentUserId();
        notificationRepository
                .findByUserIdAndReadFalseAndDismissedFalseAndScheduledForBefore(userId, Instant.now())
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    @Transactional
    public void dismiss(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setDismissed(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void dismissAll() {
        Long userId = userService.getCurrentUserId();
        notificationRepository
                .findByUserIdAndDismissedFalseAndScheduledForBeforeOrderByScheduledForDesc(userId, Instant.now())
                .forEach(n -> {
                    n.setDismissed(true);
                    notificationRepository.save(n);
                });
    }


    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void generateDailyNotifications() {
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue();

        List<Long> userIds = jdbc.queryForList("SELECT id FROM app_user", Long.class);

        for (Long userId : userIds) {
            generateTherapeuticNotifications(userId, today, dayOfWeek);
            generateWorkoutNotifications(userId, today, dayOfWeek);
            generateHabitNotifications(userId, today, dayOfWeek);
        }
    }

    private void generateTherapeuticNotifications(Long userId, LocalDate today, int dayOfWeek) {
        List<Map<String, Object>> schedules = jdbc.queryForList(
                "SELECT ts.id, ts.therapeutic_type, ts.therapeutic_id, ts.time_of_day, ts.schedule_type, ts.days_of_week, " +
                "CASE ts.therapeutic_type " +
                "  WHEN 'PEPTIDE' THEN (SELECT name FROM peptide WHERE id = ts.therapeutic_id) " +
                "  WHEN 'MEDICATION' THEN (SELECT name FROM medication WHERE id = ts.therapeutic_id) " +
                "  WHEN 'SUPPLEMENT' THEN (SELECT name FROM supplement WHERE id = ts.therapeutic_id) " +
                "END as name " +
                "FROM therapeutic_schedule ts WHERE ts.user_id = ? AND ts.active = true " +
                "AND ts.start_date <= ? AND (ts.end_date IS NULL OR ts.end_date >= ?)",
                userId, today, today);

        for (Map<String, Object> s : schedules) {
            String schedType = (String) s.get("schedule_type");
            boolean applies = "DAILY".equals(schedType);
            if ("SPECIFIC_DAYS".equals(schedType) && s.get("days_of_week") != null) {
                try {
                    java.sql.Array arr = (java.sql.Array) s.get("days_of_week");
                    Integer[] days = (Integer[]) arr.getArray();
                    for (Integer d : days) { if (d == dayOfWeek) { applies = true; break; } }
                } catch (Exception ignored) {}
            }

            if (applies) {
                String type = (String) s.get("therapeutic_type");
                Long therapeuticId = ((Number) s.get("therapeutic_id")).longValue();
                String name = (String) s.get("name");
                java.sql.Time timeOfDay = (java.sql.Time) s.get("time_of_day");

                Instant scheduledFor = timeOfDay != null
                        ? today.atTime(timeOfDay.toLocalTime()).atZone(ZoneId.systemDefault()).toInstant()
                        : today.atStartOfDay(ZoneId.systemDefault()).toInstant();

                createIfNotExists(userId, "THERAPEUTIC", type, therapeuticId,
                        "Time for " + name,
                        type.substring(0, 1) + type.substring(1).toLowerCase() + " reminder",
                        "/therapeutics/" + therapeuticId + "?type=" + type,
                        scheduledFor);
            }
        }
    }

    private void generateWorkoutNotifications(Long userId, LocalDate today, int dayOfWeek) {
        List<Map<String, Object>> schedules = jdbc.queryForList(
                "SELECT ws.id, wt.id as template_id, wt.name, ws.time_of_day, ws.days_of_week " +
                "FROM workout_schedule ws JOIN workout_template wt ON wt.id = ws.template_id " +
                "WHERE ws.user_id = ? AND ws.active = true AND ws.start_date <= ? " +
                "AND (ws.end_date IS NULL OR ws.end_date >= ?)",
                userId, today, today);

        for (Map<String, Object> s : schedules) {
            try {
                java.sql.Array arr = (java.sql.Array) s.get("days_of_week");
                if (arr == null) continue;
                Integer[] days = (Integer[]) arr.getArray();
                boolean applies = false;
                for (Integer d : days) { if (d == dayOfWeek) { applies = true; break; } }

                if (applies) {
                    Long templateId = ((Number) s.get("template_id")).longValue();
                    String name = (String) s.get("name");
                    Instant scheduledFor = today.atStartOfDay(ZoneId.systemDefault()).toInstant();

                    createIfNotExists(userId, "WORKOUT", "TEMPLATE", templateId,
                            "Workout: " + name,
                            "Scheduled workout for today",
                            "/workouts/new",
                            scheduledFor);
                }
            } catch (Exception ignored) {}
        }
    }

    private void generateHabitNotifications(Long userId, LocalDate today, int dayOfWeek) {
        List<Map<String, Object>> habits = jdbc.queryForList(
                "SELECT id, name, frequency, days_of_week, habit_type, reminder_time " +
                "FROM habit WHERE user_id = ? AND active = true", userId);

        for (Map<String, Object> h : habits) {
            String freq = (String) h.get("frequency");
            boolean applies = "DAILY".equals(freq);

            if (!applies && h.get("days_of_week") != null) {
                try {
                    java.sql.Array arr = (java.sql.Array) h.get("days_of_week");
                    Integer[] days = (Integer[]) arr.getArray();
                    for (Integer d : days) { if (d == dayOfWeek) { applies = true; break; } }
                } catch (Exception ignored) {}
            }

            if (applies) {
                Long habitId = ((Number) h.get("id")).longValue();
                String name = (String) h.get("name");
                String habitType = (String) h.get("habit_type");
                java.sql.Time reminderTime = (java.sql.Time) h.get("reminder_time");

                Instant scheduledFor = reminderTime != null
                        ? today.atTime(reminderTime.toLocalTime()).atZone(ZoneId.systemDefault()).toInstant()
                        : today.atStartOfDay(ZoneId.systemDefault()).toInstant();

                String title = "GOOD".equals(habitType)
                        ? "Don't forget: " + name
                        : "Stay strong: avoid " + name;

                createIfNotExists(userId, "HABIT", habitType, habitId,
                        title, "Habit reminder",
                        "/habits/" + habitId,
                        scheduledFor);
            }
        }
    }

    private void createIfNotExists(Long userId, String notifType, String refType, Long refId,
                                    String title, String message, String linkUrl, Instant scheduledFor) {
        LocalDate today = LocalDate.now();
        Instant dayStart = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant dayEnd = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notification WHERE user_id = ? AND reference_type = ? " +
                "AND reference_id = ? AND notification_type = ? AND scheduled_for >= ? AND scheduled_for < ?",
                Long.class, userId, refType, refId, notifType, dayStart, dayEnd);

        if (count != null && count > 0) return;

        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setNotificationType(notifType);
        n.setReferenceType(refType);
        n.setReferenceId(refId);
        n.setLinkUrl(linkUrl);
        n.setScheduledFor(scheduledFor);
        notificationRepository.save(n);
    }
}
