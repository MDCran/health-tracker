package dev.zeroday.health.insights.service;

import dev.zeroday.health.insights.dto.InsightResponse;
import dev.zeroday.health.insights.dto.InsightResponse.Insight;
import dev.zeroday.health.insights.dto.InsightResponse.Correlation;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsightsService {

    private final JdbcTemplate jdbc;
    private final UserService userService;

    @Transactional(readOnly = true)
    public InsightResponse generateInsights() {
        Long userId = userService.getCurrentUserId();
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);
        LocalDate twoWeeksAgo = today.minusDays(14);
        LocalDate monthAgo = today.minusDays(30);

        List<Insight> insights = new ArrayList<>();
        List<Correlation> correlations = new ArrayList<>();

        Map<String, Object> nutritionData = getNutritionData(userId, weekAgo, today);
        Map<String, Object> nutritionPrev = getNutritionData(userId, twoWeeksAgo, weekAgo);
        Map<String, Object> workoutData = getWorkoutData(userId, weekAgo, today);
        Map<String, Object> workoutPrev = getWorkoutData(userId, twoWeeksAgo, weekAgo);
        Map<String, Object> weightData = getWeightData(userId, monthAgo, today);
        Map<String, Object> habitData = getHabitData(userId, weekAgo, today);
        Map<String, Object> therapeuticData = getTherapeuticData(userId, weekAgo, today);
        Map<String, Object> journalData = getJournalData(userId, weekAgo, today);

        generateNutritionInsights(insights, nutritionData, nutritionPrev, userId);

        generateWorkoutInsights(insights, workoutData, workoutPrev);

        generateWeightInsights(insights, weightData);

        generateHabitInsights(insights, habitData);

        generateTherapeuticInsights(insights, therapeuticData);

        generateJournalInsights(insights, journalData);

        generateWeightCalorieCorrelation(correlations, weightData, nutritionData);

        generateWorkoutWeightCorrelation(correlations, workoutData, weightData);

        generateEnergyBalanceCorrelation(correlations, nutritionData, workoutData);

        generateHabitWellnessCorrelation(correlations, habitData, journalData);

        generateWorkoutMoodCorrelation(correlations, workoutData, journalData);

        generateTherapeuticWellnessCorrelation(correlations, therapeuticData, journalData);

        String score = calculateOverallScore(nutritionData, workoutData, habitData, therapeuticData, journalData);
        String summary = generateOverallSummary(insights, correlations);

        return InsightResponse.builder()
                .insights(insights)
                .correlations(correlations)
                .overallScore(score)
                .overallSummary(summary)
                .build();
    }

    private Map<String, Object> getNutritionData(Long userId, LocalDate from, LocalDate to) {
        Map<String, Object> data = new HashMap<>();
        try {
            Map<String, Object> row = jdbc.queryForMap(
                    "SELECT COALESCE(AVG(daily_cal), 0) as avg_calories, COALESCE(AVG(daily_pro), 0) as avg_protein, " +
                    "COUNT(DISTINCT nd.date) as days_logged FROM nutrition_day nd " +
                    "LEFT JOIN LATERAL (SELECT COALESCE(SUM(fe.calories), 0) as daily_cal, COALESCE(SUM(fe.protein_g), 0) as daily_pro " +
                    "FROM meal m JOIN food_entry fe ON fe.meal_id = m.id WHERE m.nutrition_day_id = nd.id) sub ON true " +
                    "WHERE nd.user_id = ? AND nd.date BETWEEN ? AND ?",
                    userId, from, to);
            data.putAll(row);

            Map<String, Object> profile = jdbc.queryForMap(
                    "SELECT up.weight_kg, up.height_cm, up.date_of_birth, up.gender, up.activity_level, up.diet_goal " +
                    "FROM user_profile up WHERE up.user_id = ?", userId);
            data.put("profile", profile);
        } catch (Exception e) {
            data.put("avg_calories", BigDecimal.ZERO);
            data.put("days_logged", 0L);
        }
        return data;
    }

    private Map<String, Object> getWorkoutData(Long userId, LocalDate from, LocalDate to) {
        Map<String, Object> data = new HashMap<>();
        try {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM workout_session WHERE user_id = ? AND date BETWEEN ? AND ?",
                    Integer.class, userId, from, to);
            data.put("session_count", count != null ? count : 0);

            BigDecimal volume = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) FROM exercise_set es " +
                    "JOIN workout_exercise we ON we.id = es.workout_exercise_id " +
                    "JOIN workout_session ws ON ws.id = we.session_id " +
                    "WHERE ws.user_id = ? AND ws.date BETWEEN ? AND ? AND es.completed = true",
                    BigDecimal.class, userId, from, to);
            data.put("total_volume", volume != null ? volume : BigDecimal.ZERO);

            Integer prs = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM personal_record WHERE user_id = ? AND achieved_at BETWEEN ? AND ?",
                    Integer.class, userId, from, to);
            data.put("new_prs", prs != null ? prs : 0);
        } catch (Exception e) {
            data.put("session_count", 0);
            data.put("total_volume", BigDecimal.ZERO);
        }
        return data;
    }

    private Map<String, Object> getWeightData(Long userId, LocalDate from, LocalDate to) {
        Map<String, Object> data = new HashMap<>();
        try {
            List<Map<String, Object>> weights = jdbc.queryForList(
                    "SELECT DATE(measured_at) as date, value FROM body_metric " +
                    "WHERE user_id = ? AND metric_type = 'WEIGHT' AND measured_at >= ?::date AND measured_at <= ?::date + interval '1 day' " +
                    "ORDER BY measured_at", userId, from, to);
            data.put("entries", weights);
            if (!weights.isEmpty()) {
                data.put("first_weight", toBd(weights.get(0).get("value")));
                data.put("last_weight", toBd(weights.get(weights.size() - 1).get("value")));
                BigDecimal change = toBd(weights.get(weights.size() - 1).get("value"))
                        .subtract(toBd(weights.get(0).get("value")));
                data.put("change", change);
            }
        } catch (Exception e) {
            data.put("entries", List.of());
        }
        return data;
    }

    private Map<String, Object> getHabitData(Long userId, LocalDate from, LocalDate to) {
        Map<String, Object> data = new HashMap<>();
        try {
            Integer active = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM habit WHERE user_id = ? AND active = true", Integer.class, userId);
            Integer completed = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM habit_log hl JOIN habit h ON h.id = hl.habit_id " +
                    "WHERE h.user_id = ? AND hl.date BETWEEN ? AND ? AND hl.completed = true AND h.habit_type = 'GOOD'",
                    Integer.class, userId, from, to);
            Integer badOccurrences = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM habit_log hl JOIN habit h ON h.id = hl.habit_id " +
                    "WHERE h.user_id = ? AND hl.date BETWEEN ? AND ? AND hl.completed = true AND h.habit_type = 'BAD'",
                    Integer.class, userId, from, to);

            data.put("active_count", active != null ? active : 0);
            data.put("completed_count", completed != null ? completed : 0);
            data.put("bad_occurrences", badOccurrences != null ? badOccurrences : 0);

            long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
            int goodActive = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM habit WHERE user_id = ? AND active = true AND habit_type = 'GOOD'",
                    Integer.class, userId);
            int expected = goodActive * (int) days;
            double rate = expected > 0 ? (double) (completed != null ? completed : 0) / expected * 100 : 0;
            data.put("completion_rate", rate);
        } catch (Exception e) {
            data.put("active_count", 0);
            data.put("completion_rate", 0.0);
        }
        return data;
    }

    private Map<String, Object> getTherapeuticData(Long userId, LocalDate from, LocalDate to) {
        Map<String, Object> data = new HashMap<>();
        try {
            Integer logged = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM therapeutic_log WHERE user_id = ? " +
                    "AND taken_at >= ?::date AND taken_at < (?::date + interval '1 day') AND skipped = false",
                    Integer.class, userId, from, to);
            Integer skipped = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM therapeutic_log WHERE user_id = ? " +
                    "AND taken_at >= ?::date AND taken_at < (?::date + interval '1 day') AND skipped = true",
                    Integer.class, userId, from, to);
            data.put("logged_count", logged != null ? logged : 0);
            data.put("skipped_count", skipped != null ? skipped : 0);
        } catch (Exception e) {
            data.put("logged_count", 0);
            data.put("skipped_count", 0);
        }
        return data;
    }

    private Map<String, Object> getJournalData(Long userId, LocalDate from, LocalDate to) {
        Map<String, Object> data = new HashMap<>();
        try {
            BigDecimal avgRating = jdbc.queryForObject(
                    "SELECT COALESCE(AVG(overall_rating), 0) FROM journal_entry " +
                    "WHERE user_id = ? AND date BETWEEN ? AND ?",
                    BigDecimal.class, userId, from, to);
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM journal_entry WHERE user_id = ? AND date BETWEEN ? AND ?",
                    Integer.class, userId, from, to);
            data.put("avg_rating", avgRating != null ? avgRating : BigDecimal.ZERO);
            data.put("entry_count", count != null ? count : 0);
        } catch (Exception e) {
            data.put("avg_rating", BigDecimal.ZERO);
            data.put("entry_count", 0);
        }
        return data;
    }

    private void generateNutritionInsights(List<Insight> insights, Map<String, Object> data,
                                            Map<String, Object> prev, Long userId) {
        double avgCal = toBd(data.get("avg_calories")).doubleValue();
        long daysLogged = toLong(data.get("days_logged"));

        if (daysLogged == 0) {
            insights.add(Insight.builder()
                    .id("nutr-no-logs").category("NUTRITION").severity("WARNING")
                    .title("No meals logged this week")
                    .message("Start tracking your nutrition to get personalized recommendations.")
                    .actionLabel("Log a meal").actionLink("/nutrition/entry").build());
            return;
        }

        if (daysLogged < 5) {
            insights.add(Insight.builder()
                    .id("nutr-inconsistent").category("NUTRITION").severity("INFO")
                    .title("Inconsistent logging")
                    .message("You logged meals on " + daysLogged + " of the last 7 days. Log daily for best results.")
                    .actionLabel("Log today").actionLink("/nutrition/entry").build());
        }

        double prevAvgCal = toBd(prev.get("avg_calories")).doubleValue();
        if (prevAvgCal > 0 && avgCal > prevAvgCal * 1.15) {
            insights.add(Insight.builder()
                    .id("nutr-cal-up").category("NUTRITION").severity("WARNING")
                    .title("Calorie intake increasing")
                    .message(String.format("Avg %.0f cal/day this week vs %.0f last week (+%.0f%%).",
                            avgCal, prevAvgCal, ((avgCal - prevAvgCal) / prevAvgCal) * 100))
                    .actionLabel("View nutrition").actionLink("/nutrition").build());
        } else if (prevAvgCal > 0 && avgCal < prevAvgCal * 0.85) {
            insights.add(Insight.builder()
                    .id("nutr-cal-down").category("NUTRITION").severity("POSITIVE")
                    .title("Calorie intake decreasing")
                    .message(String.format("Avg %.0f cal/day this week vs %.0f last week.", avgCal, prevAvgCal))
                    .build());
        }
    }

    private void generateWorkoutInsights(List<Insight> insights, Map<String, Object> data,
                                          Map<String, Object> prev) {
        int sessions = toInt(data.get("session_count"));
        int prevSessions = toInt(prev.get("session_count"));
        int prs = toInt(data.get("new_prs"));

        if (sessions == 0) {
            insights.add(Insight.builder()
                    .id("wk-none").category("WORKOUT").severity("NEGATIVE")
                    .title("No workouts this week")
                    .message("Stay active! Even a short workout counts.")
                    .actionLabel("Start workout").actionLink("/workouts/new").build());
        } else if (sessions >= 5) {
            insights.add(Insight.builder()
                    .id("wk-great").category("WORKOUT").severity("POSITIVE")
                    .title("Excellent workout consistency!")
                    .message(sessions + " workouts this week. Keep it up!")
                    .build());
        } else if (sessions > prevSessions) {
            insights.add(Insight.builder()
                    .id("wk-improving").category("WORKOUT").severity("POSITIVE")
                    .title("Workout frequency improving")
                    .message(sessions + " workouts this week vs " + prevSessions + " last week.")
                    .build());
        }

        if (prs > 0) {
            insights.add(Insight.builder()
                    .id("wk-prs").category("WORKOUT").severity("POSITIVE")
                    .title(prs + " new PR" + (prs > 1 ? "s" : "") + " this week!")
                    .message("You're getting stronger. Great progress!")
                    .actionLabel("View PRs").actionLink("/workouts").build());
        }
    }

    private void generateWeightInsights(List<Insight> insights, Map<String, Object> data) {
        if (data.get("change") == null) return;
        BigDecimal change = (BigDecimal) data.get("change");
        double ch = change.doubleValue();

        if (Math.abs(ch) < 0.2) {
            insights.add(Insight.builder()
                    .id("wt-stable").category("WEIGHT").severity("INFO")
                    .title("Weight is stable")
                    .message("Your weight hasn't changed significantly this month.")
                    .build());
        } else if (ch > 1.0) {
            insights.add(Insight.builder()
                    .id("wt-gaining").category("WEIGHT").severity("WARNING")
                    .title("Weight trending up")
                    .message(String.format("You've gained %.1f kg this month. Review your nutrition and activity.", ch))
                    .actionLabel("Check nutrition").actionLink("/nutrition").build());
        } else if (ch < -1.0) {
            insights.add(Insight.builder()
                    .id("wt-losing").category("WEIGHT").severity("POSITIVE")
                    .title("Weight trending down")
                    .message(String.format("You've lost %.1f kg this month.", Math.abs(ch)))
                    .build());
        }
    }

    private void generateHabitInsights(List<Insight> insights, Map<String, Object> data) {
        double rate = (double) data.getOrDefault("completion_rate", 0.0);
        int badOccurrences = toInt(data.get("bad_occurrences"));

        if (rate >= 80) {
            insights.add(Insight.builder()
                    .id("hab-great").category("HABITS").severity("POSITIVE")
                    .title("Strong habit consistency")
                    .message(String.format("%.0f%% completion rate this week!", rate))
                    .build());
        } else if (rate < 50 && rate > 0) {
            insights.add(Insight.builder()
                    .id("hab-low").category("HABITS").severity("WARNING")
                    .title("Habit completion dropping")
                    .message(String.format("Only %.0f%% completion this week. Focus on your top priorities.", rate))
                    .actionLabel("View habits").actionLink("/habits").build());
        }

        if (badOccurrences == 0 && toInt(data.get("active_count")) > 0) {
            insights.add(Insight.builder()
                    .id("hab-clean").category("HABITS").severity("POSITIVE")
                    .title("Clean week!")
                    .message("Zero bad habit occurrences this week. Stay strong!")
                    .build());
        } else if (badOccurrences > 3) {
            insights.add(Insight.builder()
                    .id("hab-bad-high").category("HABITS").severity("NEGATIVE")
                    .title("Bad habits spiking")
                    .message(badOccurrences + " bad habit occurrences this week. Identify your triggers.")
                    .actionLabel("Review habits").actionLink("/habits").build());
        }
    }

    private void generateTherapeuticInsights(List<Insight> insights, Map<String, Object> data) {
        int logged = toInt(data.get("logged_count"));
        int skipped = toInt(data.get("skipped_count"));

        if (logged == 0 && skipped == 0) return;

        if (skipped > 2) {
            insights.add(Insight.builder()
                    .id("ther-skipped").category("THERAPEUTICS").severity("WARNING")
                    .title("Missed therapeutics")
                    .message(skipped + " skipped doses this week. Consistency is key for effectiveness.")
                    .actionLabel("View schedule").actionLink("/calendar").build());
        } else if (logged > 0 && skipped == 0) {
            insights.add(Insight.builder()
                    .id("ther-perfect").category("THERAPEUTICS").severity("POSITIVE")
                    .title("Perfect therapeutic adherence")
                    .message("All scheduled doses taken this week!")
                    .build());
        }
    }

    private void generateJournalInsights(List<Insight> insights, Map<String, Object> data) {
        int entries = toInt(data.get("entry_count"));
        double avgRating = toBd(data.get("avg_rating")).doubleValue();

        if (entries == 0) {
            insights.add(Insight.builder()
                    .id("jrn-none").category("JOURNAL").severity("INFO")
                    .title("No journal entries this week")
                    .message("Reflecting daily improves self-awareness and progress tracking.")
                    .actionLabel("Write entry").actionLink("/journal/new").build());
        } else if (avgRating < 4) {
            insights.add(Insight.builder()
                    .id("jrn-low").category("JOURNAL").severity("WARNING")
                    .title("Low wellness scores")
                    .message(String.format("Average rating %.1f/10 this week. Consider what areas need attention.", avgRating))
                    .actionLabel("View journal").actionLink("/journal").build());
        } else if (avgRating >= 7) {
            insights.add(Insight.builder()
                    .id("jrn-high").category("JOURNAL").severity("POSITIVE")
                    .title("Great wellness scores!")
                    .message(String.format("Average rating %.1f/10 this week. You're thriving!", avgRating))
                    .build());
        }
    }

    private void generateWeightCalorieCorrelation(List<Correlation> correlations,
                                                   Map<String, Object> weightData,
                                                   Map<String, Object> nutritionData) {
        if (weightData.get("change") == null) return;
        double weightChange = ((BigDecimal) weightData.get("change")).doubleValue();
        double avgCal = toBd(nutritionData.get("avg_calories")).doubleValue();

        if (weightChange > 0.5 && avgCal > 2200) {
            correlations.add(Correlation.builder()
                    .id("corr-wt-cal-up")
                    .title("Weight gain + high calorie intake")
                    .description(String.format("Weight up %.1f kg while averaging %.0f cal/day. Consider reducing portions or increasing activity.", weightChange, avgCal))
                    .trend("UP").sentiment("NEGATIVE")
                    .modules(List.of("WEIGHT", "NUTRITION")).build());
        } else if (weightChange < -0.5 && avgCal < 1800) {
            correlations.add(Correlation.builder()
                    .id("corr-wt-cal-down")
                    .title("Weight loss + calorie deficit")
                    .description(String.format("Weight down %.1f kg with avg %.0f cal/day. Your deficit is working!", Math.abs(weightChange), avgCal))
                    .trend("DOWN").sentiment("POSITIVE")
                    .modules(List.of("WEIGHT", "NUTRITION")).build());
        }
    }

    private void generateWorkoutWeightCorrelation(List<Correlation> correlations,
                                                   Map<String, Object> workoutData,
                                                   Map<String, Object> weightData) {
        int sessions = toInt(workoutData.get("session_count"));
        if (weightData.get("change") == null) return;
        double weightChange = ((BigDecimal) weightData.get("change")).doubleValue();

        if (sessions >= 4 && weightChange < -0.3) {
            correlations.add(Correlation.builder()
                    .id("corr-wk-wt-good")
                    .title("Consistent training + weight loss")
                    .description("Your workout consistency is paying off - weight trending down while staying active.")
                    .trend("DOWN").sentiment("POSITIVE")
                    .modules(List.of("WORKOUT", "WEIGHT")).build());
        } else if (sessions <= 1 && weightChange > 0.5) {
            correlations.add(Correlation.builder()
                    .id("corr-wk-wt-bad")
                    .title("Low activity + weight gain")
                    .description("Weight is increasing while workout frequency is low. Try to fit in more sessions.")
                    .trend("UP").sentiment("NEGATIVE")
                    .modules(List.of("WORKOUT", "WEIGHT")).build());
        }
    }

    private void generateEnergyBalanceCorrelation(List<Correlation> correlations,
                                                   Map<String, Object> nutritionData,
                                                   Map<String, Object> workoutData) {
        double avgCal = toBd(nutritionData.get("avg_calories")).doubleValue();
        int sessions = toInt(workoutData.get("session_count"));
        BigDecimal volume = (BigDecimal) workoutData.getOrDefault("total_volume", BigDecimal.ZERO);

        if (avgCal > 2500 && sessions >= 4 && volume.doubleValue() > 10000) {
            correlations.add(Correlation.builder()
                    .id("corr-energy-bulk")
                    .title("High intake + high training volume")
                    .description("You're eating big and training hard. Great for a bulk phase!")
                    .trend("UP").sentiment("POSITIVE")
                    .modules(List.of("NUTRITION", "WORKOUT")).build());
        } else if (avgCal < 1600 && sessions >= 3) {
            correlations.add(Correlation.builder()
                    .id("corr-energy-deficit")
                    .title("Low calories + active training")
                    .description("Make sure you're eating enough to fuel your workouts and recovery.")
                    .trend("DOWN").sentiment("NEGATIVE")
                    .modules(List.of("NUTRITION", "WORKOUT")).build());
        }
    }

    private void generateHabitWellnessCorrelation(List<Correlation> correlations,
                                                   Map<String, Object> habitData,
                                                   Map<String, Object> journalData) {
        double habitRate = (double) habitData.getOrDefault("completion_rate", 0.0);
        double avgRating = toBd(journalData.get("avg_rating")).doubleValue();

        if (habitRate > 70 && avgRating > 6) {
            correlations.add(Correlation.builder()
                    .id("corr-hab-well")
                    .title("Good habits = higher wellness")
                    .description("Your habit consistency correlates with improved wellness scores. The system is working!")
                    .trend("UP").sentiment("POSITIVE")
                    .modules(List.of("HABITS", "JOURNAL")).build());
        } else if (habitRate < 40 && avgRating < 5) {
            correlations.add(Correlation.builder()
                    .id("corr-hab-well-low")
                    .title("Low habits + low wellness")
                    .description("When habits slip, wellness tends to follow. Focus on your keystone habits to turn things around.")
                    .trend("DOWN").sentiment("NEGATIVE")
                    .modules(List.of("HABITS", "JOURNAL")).build());
        }
    }

    private void generateWorkoutMoodCorrelation(List<Correlation> correlations,
                                                 Map<String, Object> workoutData,
                                                 Map<String, Object> journalData) {
        int sessions = toInt(workoutData.get("session_count"));
        double avgRating = toBd(journalData.get("avg_rating")).doubleValue();

        if (sessions >= 4 && avgRating >= 7) {
            correlations.add(Correlation.builder()
                    .id("corr-wk-mood")
                    .title("Regular exercise + positive mood")
                    .description("You feel better when you work out more. Exercise is a powerful mood booster.")
                    .trend("UP").sentiment("POSITIVE")
                    .modules(List.of("WORKOUT", "JOURNAL")).build());
        }
    }

    private void generateTherapeuticWellnessCorrelation(List<Correlation> correlations,
                                                         Map<String, Object> therapeuticData,
                                                         Map<String, Object> journalData) {
        int logged = toInt(therapeuticData.get("logged_count"));
        double avgRating = toBd(journalData.get("avg_rating")).doubleValue();

        if (logged > 5 && avgRating > 6) {
            correlations.add(Correlation.builder()
                    .id("corr-ther-well")
                    .title("Consistent therapeutics + improved wellness")
                    .description("Your therapeutic adherence appears to correlate with better wellness scores.")
                    .trend("STABLE").sentiment("POSITIVE")
                    .modules(List.of("THERAPEUTICS", "JOURNAL")).build());
        }
    }

    private String calculateOverallScore(Map<String, Object> nutrition, Map<String, Object> workouts,
                                          Map<String, Object> habits, Map<String, Object> therapeutics,
                                          Map<String, Object> journal) {
        double score = 50;

        long daysLogged = toLong(nutrition.get("days_logged"));
        if (daysLogged >= 5) score += 10; else if (daysLogged >= 3) score += 5;

        int sessions = toInt(workouts.get("session_count"));
        if (sessions >= 4) score += 15; else if (sessions >= 2) score += 8;

        double habitRate = (double) habits.getOrDefault("completion_rate", 0.0);
        score += habitRate * 0.1;

        int logged = toInt(therapeutics.get("logged_count"));
        int skipped = toInt(therapeutics.get("skipped_count"));
        if (logged > 0 && skipped == 0) score += 5;

        double avgRating = toBd(journal.get("avg_rating")).doubleValue();
        score += avgRating;

        score = Math.min(100, Math.max(0, score));

        if (score >= 80) return "A";
        if (score >= 65) return "B";
        if (score >= 50) return "C";
        if (score >= 35) return "D";
        return "F";
    }

    private String generateOverallSummary(List<Insight> insights, List<Correlation> correlations) {
        long positive = insights.stream().filter(i -> "POSITIVE".equals(i.getSeverity())).count();
        long negative = insights.stream().filter(i -> "NEGATIVE".equals(i.getSeverity())).count();
        long warnings = insights.stream().filter(i -> "WARNING".equals(i.getSeverity())).count();

        if (positive > negative + warnings) {
            return "You're doing great overall! Keep up the momentum.";
        } else if (negative > positive) {
            return "Some areas need attention. Focus on the recommended actions below.";
        } else {
            return "Mixed results this week. Small improvements in key areas will compound over time.";
        }
    }

    private BigDecimal toBd(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal bd) return bd;
        if (obj instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }

    private int toInt(Object obj) {
        if (obj == null) return 0;
        if (obj instanceof Number n) return n.intValue();
        return 0;
    }

    private long toLong(Object obj) {
        if (obj == null) return 0;
        if (obj instanceof Number n) return n.longValue();
        return 0;
    }
}
