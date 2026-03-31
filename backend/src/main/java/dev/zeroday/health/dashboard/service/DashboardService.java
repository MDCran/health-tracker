package dev.zeroday.health.dashboard.service;

import dev.zeroday.health.dashboard.dto.DashboardResponse;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JdbcTemplate jdbc;
    private final UserService userService;

    public DashboardResponse getDashboard(String period, LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();

        if (from == null || to == null) {
            to = LocalDate.now();
            from = switch (period != null ? period.toUpperCase() : "WEEK") {
                case "DAY" -> to;
                case "MONTH" -> to.minusMonths(1);
                case "YEAR" -> to.minusYears(1);
                default -> to.minusWeeks(1);
            };
        }

        return DashboardResponse.builder()
                .workouts(getWorkoutSummary(userId, from, to))
                .nutrition(getNutritionSummary(userId, from, to))
                .journal(getJournalSummary(userId, from, to))
                .habits(getHabitSummary(userId, from, to))
                .therapeutics(getTherapeuticSummary(userId, from, to))
                .metrics(getMetricSummary(userId, from, to))
                .build();
    }

    private DashboardResponse.WorkoutSummary getWorkoutSummary(Long userId, LocalDate from, LocalDate to) {
        Integer sessions = jdbc.queryForObject(
                "SELECT COUNT(*) FROM workout_session WHERE user_id = ? AND date BETWEEN ? AND ?",
                Integer.class, userId, from, to);

        Integer exercises = jdbc.queryForObject(
                "SELECT COUNT(*) FROM workout_exercise we " +
                "JOIN workout_session ws ON ws.id = we.session_id " +
                "WHERE ws.user_id = ? AND ws.date BETWEEN ? AND ?",
                Integer.class, userId, from, to);

        Integer sets = jdbc.queryForObject(
                "SELECT COUNT(*) FROM exercise_set es " +
                "JOIN workout_exercise we ON we.id = es.workout_exercise_id " +
                "JOIN workout_session ws ON ws.id = we.session_id " +
                "WHERE ws.user_id = ? AND ws.date BETWEEN ? AND ? AND es.completed = true",
                Integer.class, userId, from, to);

        BigDecimal volume = jdbc.queryForObject(
                "SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) FROM exercise_set es " +
                "JOIN workout_exercise we ON we.id = es.workout_exercise_id " +
                "JOIN workout_session ws ON ws.id = we.session_id " +
                "WHERE ws.user_id = ? AND ws.date BETWEEN ? AND ? AND es.completed = true",
                BigDecimal.class, userId, from, to);

        Integer prs = jdbc.queryForObject(
                "SELECT COUNT(*) FROM personal_record WHERE user_id = ? AND achieved_at BETWEEN ? AND ?",
                Integer.class, userId, from, to);

        List<Map<String, Object>> frequency = jdbc.queryForList(
                "SELECT date, COUNT(*) as count FROM workout_session " +
                "WHERE user_id = ? AND date BETWEEN ? AND ? GROUP BY date ORDER BY date",
                userId, from, to);

        return DashboardResponse.WorkoutSummary.builder()
                .totalSessions(sessions != null ? sessions : 0)
                .totalExercises(exercises != null ? exercises : 0)
                .totalSets(sets != null ? sets : 0)
                .totalVolumeKg(volume != null ? volume : BigDecimal.ZERO)
                .newPrs(prs != null ? prs : 0)
                .frequencyByDay(frequency)
                .build();
    }

    private DashboardResponse.NutritionSummary getNutritionSummary(Long userId, LocalDate from, LocalDate to) {
        List<Map<String, Object>> dailyData = jdbc.queryForList(
                "SELECT nd.date, " +
                "COALESCE(SUM(fe.calories), 0) as calories, " +
                "COALESCE(SUM(fe.protein_g), 0) as protein, " +
                "COALESCE(SUM(fe.carbs_g), 0) as carbs, " +
                "COALESCE(SUM(fe.fat_g), 0) as fat " +
                "FROM nutrition_day nd " +
                "JOIN meal m ON m.nutrition_day_id = nd.id " +
                "JOIN food_entry fe ON fe.meal_id = m.id " +
                "WHERE nd.user_id = ? AND nd.date BETWEEN ? AND ? " +
                "GROUP BY nd.date ORDER BY nd.date",
                userId, from, to);

        int daysLogged = dailyData.size();
        BigDecimal avgCal = BigDecimal.ZERO, avgPro = BigDecimal.ZERO;
        BigDecimal avgCarb = BigDecimal.ZERO, avgFat = BigDecimal.ZERO;

        if (daysLogged > 0) {
            BigDecimal totalCal = BigDecimal.ZERO, totalPro = BigDecimal.ZERO;
            BigDecimal totalCarb = BigDecimal.ZERO, totalFat = BigDecimal.ZERO;
            for (Map<String, Object> row : dailyData) {
                totalCal = totalCal.add(toBigDecimal(row.get("calories")));
                totalPro = totalPro.add(toBigDecimal(row.get("protein")));
                totalCarb = totalCarb.add(toBigDecimal(row.get("carbs")));
                totalFat = totalFat.add(toBigDecimal(row.get("fat")));
            }
            BigDecimal count = BigDecimal.valueOf(daysLogged);
            avgCal = totalCal.divide(count, 0, RoundingMode.HALF_UP);
            avgPro = totalPro.divide(count, 1, RoundingMode.HALF_UP);
            avgCarb = totalCarb.divide(count, 1, RoundingMode.HALF_UP);
            avgFat = totalFat.divide(count, 1, RoundingMode.HALF_UP);
        }

        return DashboardResponse.NutritionSummary.builder()
                .avgCalories(avgCal).avgProteinG(avgPro).avgCarbsG(avgCarb).avgFatG(avgFat)
                .daysLogged(daysLogged).dailyCalories(dailyData).build();
    }

    private DashboardResponse.JournalSummary getJournalSummary(Long userId, LocalDate from, LocalDate to) {
        BigDecimal avgRating = jdbc.queryForObject(
                "SELECT COALESCE(AVG(overall_rating), 0) FROM journal_entry " +
                "WHERE user_id = ? AND date BETWEEN ? AND ?",
                BigDecimal.class, userId, from, to);

        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM journal_entry WHERE user_id = ? AND date BETWEEN ? AND ?",
                Integer.class, userId, from, to);

        List<Map<String, Object>> realmData = jdbc.queryForList(
                "SELECT rr.realm, AVG(rr.rating) as avg_rating FROM realm_rating rr " +
                "JOIN journal_entry je ON je.id = rr.journal_entry_id " +
                "WHERE je.user_id = ? AND je.date BETWEEN ? AND ? " +
                "GROUP BY rr.realm",
                userId, from, to);

        Map<String, BigDecimal> realmAverages = new HashMap<>();
        for (Map<String, Object> row : realmData) {
            realmAverages.put((String) row.get("realm"),
                    toBigDecimal(row.get("avg_rating")).setScale(1, RoundingMode.HALF_UP));
        }

        List<Map<String, Object>> trend = jdbc.queryForList(
                "SELECT date, overall_rating FROM journal_entry " +
                "WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date",
                userId, from, to);

        return DashboardResponse.JournalSummary.builder()
                .avgOverallRating(avgRating != null ? avgRating.setScale(1, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .realmAverages(realmAverages)
                .entriesCount(count != null ? count : 0)
                .ratingTrend(trend)
                .build();
    }

    private DashboardResponse.HabitSummary getHabitSummary(Long userId, LocalDate from, LocalDate to) {
        Integer active = jdbc.queryForObject(
                "SELECT COUNT(*) FROM habit WHERE user_id = ? AND active = true",
                Integer.class, userId);

        Integer completed = jdbc.queryForObject(
                "SELECT COUNT(*) FROM habit_log hl " +
                "JOIN habit h ON h.id = hl.habit_id " +
                "WHERE h.user_id = ? AND hl.date BETWEEN ? AND ? AND hl.completed = true",
                Integer.class, userId, from, to);

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        int expected = (active != null ? active : 0) * (int) totalDays;
        BigDecimal rate = expected > 0 ?
                BigDecimal.valueOf(completed != null ? completed : 0)
                        .divide(BigDecimal.valueOf(expected), 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)) :
                BigDecimal.ZERO;

        return DashboardResponse.HabitSummary.builder()
                .activeHabits(active != null ? active : 0)
                .overallCompletionRate(rate)
                .longestStreak(0)
                .topHabits(List.of())
                .build();
    }

    private DashboardResponse.TherapeuticSummary getTherapeuticSummary(Long userId, LocalDate from, LocalDate to) {
        Integer peptides = jdbc.queryForObject(
                "SELECT COUNT(*) FROM peptide WHERE user_id = ? AND active = true", Integer.class, userId);
        Integer meds = jdbc.queryForObject(
                "SELECT COUNT(*) FROM medication WHERE user_id = ? AND active = true", Integer.class, userId);
        Integer supps = jdbc.queryForObject(
                "SELECT COUNT(*) FROM supplement WHERE user_id = ? AND active = true", Integer.class, userId);

        Integer logged = jdbc.queryForObject(
                "SELECT COUNT(*) FROM therapeutic_log " +
                "WHERE user_id = ? AND taken_at >= ?::date AND taken_at < (?::date + interval '1 day') AND skipped = false",
                Integer.class, userId, from, to);

        return DashboardResponse.TherapeuticSummary.builder()
                .activePeptides(peptides != null ? peptides : 0)
                .activeMedications(meds != null ? meds : 0)
                .activeSupplements(supps != null ? supps : 0)
                .adherenceRate(BigDecimal.ZERO)
                .scheduledCount(0)
                .completedCount(logged != null ? logged : 0)
                .build();
    }

    private DashboardResponse.MetricSummary getMetricSummary(Long userId, LocalDate from, LocalDate to) {
        List<Map<String, Object>> weightTrend = jdbc.queryForList(
                "SELECT DATE(measured_at) as date, value FROM body_metric " +
                "WHERE user_id = ? AND metric_type = 'WEIGHT' AND measured_at >= ?::date AND measured_at <= ?::date + interval '1 day' " +
                "ORDER BY measured_at",
                userId, from, to);

        BigDecimal currentWeight = null;
        BigDecimal weightChange = BigDecimal.ZERO;
        if (!weightTrend.isEmpty()) {
            currentWeight = toBigDecimal(weightTrend.get(weightTrend.size() - 1).get("value"));
            if (weightTrend.size() > 1) {
                BigDecimal first = toBigDecimal(weightTrend.get(0).get("value"));
                weightChange = currentWeight.subtract(first);
            }
        }

        return DashboardResponse.MetricSummary.builder()
                .currentWeight(currentWeight)
                .weightChange(weightChange)
                .weightTrend(weightTrend)
                .build();
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal bd) return bd;
        if (obj instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }
}
