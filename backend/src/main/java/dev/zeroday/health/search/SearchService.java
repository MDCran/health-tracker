package dev.zeroday.health.search;

import dev.zeroday.health.user.UserService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int CATEGORY_COUNT = 11;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM d, yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a");

    private static final Map<String, String> METRIC_LABELS = Map.ofEntries(
            Map.entry("WEIGHT", "Weight"), Map.entry("BODY_FAT", "Body Fat %"), Map.entry("BMI", "BMI"),
            Map.entry("SKELETAL_MUSCLE", "Skeletal Muscle %"), Map.entry("MUSCLE_MASS", "Muscle Mass"),
            Map.entry("BMR", "BMR"), Map.entry("FAT_FREE_WEIGHT", "Fat-Free Weight"),
            Map.entry("BODY_WATER", "Body Water %"), Map.entry("BONE_MASS", "Bone Mass"),
            Map.entry("CHEST", "Chest"), Map.entry("SHOULDERS", "Shoulders"), Map.entry("WAIST", "Waist"),
            Map.entry("HIPS", "Hips"), Map.entry("LEFT_ARM", "Left Arm"), Map.entry("RIGHT_ARM", "Right Arm"),
            Map.entry("LEFT_THIGH", "Left Thigh"), Map.entry("RIGHT_THIGH", "Right Thigh"),
            Map.entry("NECK", "Neck"), Map.entry("ABDOMEN", "Abdomen")
    );

    private static final Map<String, String> VITAL_LABELS = Map.of(
            "BLOOD_PRESSURE", "Blood Pressure", "RESTING_HEART_RATE", "Resting Heart Rate",
            "HRV", "Heart Rate Variability", "BODY_TEMPERATURE", "Body Temperature",
            "BLOOD_OXYGEN", "Blood Oxygen (SpO2)", "BLOOD_GLUCOSE", "Blood Glucose",
            "RESPIRATORY_RATE", "Respiratory Rate", "WEIGHT", "Weight"
    );

    private final EntityManager em;
    private final UserService userService;

    @Transactional(readOnly = true)
    public SearchResponse search(String query, int limit) {
        Long userId = userService.getCurrentUserId();
        int perCategory = Math.max(2, limit / CATEGORY_COUNT);
        String pattern = "%" + query.toLowerCase() + "%";

        List<SearchResult> results = new ArrayList<>();
        results.addAll(searchWorkouts(userId, pattern, perCategory));
        results.addAll(searchHabits(userId, pattern, perCategory));
        results.addAll(searchNutrition(userId, pattern, perCategory));
        results.addAll(searchSleep(userId, pattern, perCategory));
        results.addAll(searchAppointments(userId, pattern, perCategory));
        results.addAll(searchMedicalRecords(userId, pattern, perCategory));
        results.addAll(searchSubstanceLogs(userId, pattern, perCategory));
        results.addAll(searchJournalEntries(userId, pattern, perCategory));
        results.addAll(searchTherapeutics(userId, pattern, perCategory));
        results.addAll(searchVitals(userId, pattern, perCategory));
        results.addAll(searchBodyMetrics(userId, pattern, perCategory));

        return SearchResponse.builder().results(results).totalCount(results.size()).build();
    }

    private String fmtDate(Object d) {
        if (d == null) return "";
        if (d instanceof LocalDate ld) return ld.format(DATE_FMT);
        if (d instanceof Instant i) return i.atZone(ZoneOffset.UTC).format(DATETIME_FMT);
        return d.toString();
    }

    private String humanize(String raw) {
        if (raw == null) return "";
        return raw.replace('_', ' ').substring(0, 1).toUpperCase() + raw.replace('_', ' ').substring(1).toLowerCase();
    }

    private List<SearchResult> searchWorkouts(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT w.id, w.name, w.date, w.durationSeconds FROM WorkoutSession w " +
                        "WHERE w.userId = :userId AND LOWER(w.name) LIKE :pattern ORDER BY w.date DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String duration = r[3] != null ? ((int) r[3] / 60) + " min" : "";
            String sub = fmtDate(r[2]) + (duration.isEmpty() ? "" : " · " + duration);
            return SearchResult.builder().category("workouts").id((Long) r[0])
                    .title(r[1] != null ? (String) r[1] : "Workout")
                    .subtitle(sub).url("/workouts/" + r[0]).build();
        }).toList();
    }

    private List<SearchResult> searchHabits(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT h.id, h.name, h.habitType, h.frequency FROM Habit h " +
                        "WHERE h.userId = :userId AND (LOWER(h.name) LIKE :pattern OR LOWER(h.description) LIKE :pattern) ORDER BY h.name")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String type = "GOOD".equals(r[2]) ? "Build" : "Break";
            return SearchResult.builder().category("habits").id((Long) r[0])
                    .title((String) r[1]).subtitle(type + " · " + humanize((String) r[3]))
                    .url("/habits/" + r[0]).build();
        }).toList();
    }

    private List<SearchResult> searchNutrition(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT f.id, f.description, f.calories, nd.date FROM FoodEntry f " +
                        "JOIN f.meal m JOIN m.nutritionDay nd WHERE nd.userId = :userId AND LOWER(f.description) LIKE :pattern " +
                        "ORDER BY nd.date DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String cal = r[2] != null ? r[2] + " cal" : "";
            String date = fmtDate(r[3]);
            return SearchResult.builder().category("nutrition").id((Long) r[0])
                    .title((String) r[1]).subtitle(cal + (date.isEmpty() ? "" : " · " + date))
                    .url("/nutrition").build();
        }).toList();
    }

    private List<SearchResult> searchSleep(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT s.id, s.date, s.totalMinutes, s.notes FROM SleepEntry s " +
                        "WHERE s.userId = :userId AND LOWER(s.notes) LIKE :pattern ORDER BY s.date DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            int mins = r[2] != null ? (int) r[2] : 0;
            String hours = mins > 0 ? String.format("%.1fh", mins / 60.0) : "";
            return SearchResult.builder().category("sleep").id((Long) r[0])
                    .title("Sleep · " + fmtDate(r[1])).subtitle(hours)
                    .url("/sleep").build();
        }).toList();
    }

    private List<SearchResult> searchAppointments(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT a.id, a.title, a.appointmentDate, a.doctorName FROM Appointment a " +
                        "WHERE a.userId = :userId AND (LOWER(a.title) LIKE :pattern OR LOWER(a.doctorName) LIKE :pattern " +
                        "OR LOWER(a.officeName) LIKE :pattern OR LOWER(a.specialty) LIKE :pattern " +
                        "OR LOWER(a.notes) LIKE :pattern) ORDER BY a.appointmentDate DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String doc = r[3] != null ? (String) r[3] : "";
            return SearchResult.builder().category("appointments").id((Long) r[0])
                    .title((String) r[1]).subtitle(fmtDate(r[2]) + (doc.isEmpty() ? "" : " · " + doc))
                    .url("/appointments").build();
        }).toList();
    }

    private List<SearchResult> searchMedicalRecords(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT m.id, m.name, m.recordDate, m.providerName FROM MedicalRecord m " +
                        "WHERE m.userId = :userId AND (LOWER(m.name) LIKE :pattern OR LOWER(m.providerName) LIKE :pattern " +
                        "OR LOWER(m.doctorName) LIKE :pattern OR LOWER(m.notes) LIKE :pattern) ORDER BY m.recordDate DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String provider = r[3] != null ? (String) r[3] : "";
            return SearchResult.builder().category("medical_records").id((Long) r[0])
                    .title((String) r[1]).subtitle(fmtDate(r[2]) + (provider.isEmpty() ? "" : " · " + provider))
                    .url("/medical-records").build();
        }).toList();
    }

    private List<SearchResult> searchSubstanceLogs(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT s.id, s.substanceType, s.occurredAt, s.amount FROM SubstanceLog s " +
                        "WHERE s.userId = :userId AND (LOWER(s.substanceType) LIKE :pattern OR LOWER(s.amount) LIKE :pattern " +
                        "OR LOWER(s.notes) LIKE :pattern OR LOWER(s.context) LIKE :pattern) ORDER BY s.occurredAt DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String amount = r[3] != null ? (String) r[3] : "";
            return SearchResult.builder().category("substance_tracker").id((Long) r[0])
                    .title(humanize((String) r[1])).subtitle(fmtDate(r[2]) + (amount.isEmpty() ? "" : " · " + amount))
                    .url("/substance-tracker").build();
        }).toList();
    }

    private List<SearchResult> searchJournalEntries(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT j.id, j.date, j.reflection, j.gratitude FROM JournalEntry j " +
                        "WHERE j.userId = :userId AND (LOWER(j.reflection) LIKE :pattern OR LOWER(j.gratitude) LIKE :pattern) " +
                        "ORDER BY j.date DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String preview = r[2] != null ? ((String) r[2]).substring(0, Math.min(60, ((String) r[2]).length())) : "";
            if (preview.isEmpty() && r[3] != null) preview = ((String) r[3]).substring(0, Math.min(60, ((String) r[3]).length()));
            return SearchResult.builder().category("journal").id((Long) r[0])
                    .title("Journal · " + fmtDate(r[1])).subtitle(preview.isEmpty() ? null : preview + "...")
                    .url("/journal/" + (r[1] != null ? r[1].toString() : "")).build();
        }).toList();
    }

    private List<SearchResult> searchTherapeutics(Long userId, String pattern, int limit) {
        int sub = Math.max(1, limit / 3);
        List<SearchResult> results = new ArrayList<>();

        @SuppressWarnings("unchecked")
        List<Object[]> peptides = em.createQuery(
                "SELECT p.id, p.name FROM Peptide p WHERE p.userId = :userId AND LOWER(p.name) LIKE :pattern ORDER BY p.name")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(sub).getResultList();
        results.addAll(peptides.stream().map(r -> SearchResult.builder().category("therapeutics").id((Long) r[0])
                .title((String) r[1]).subtitle("Injectable").url("/therapeutics/" + r[0] + "?type=PEPTIDE").build()).toList());

        @SuppressWarnings("unchecked")
        List<Object[]> meds = em.createQuery(
                "SELECT m.id, m.name FROM Medication m WHERE m.userId = :userId AND LOWER(m.name) LIKE :pattern ORDER BY m.name")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(sub).getResultList();
        results.addAll(meds.stream().map(r -> SearchResult.builder().category("therapeutics").id((Long) r[0])
                .title((String) r[1]).subtitle("Medication").url("/therapeutics/" + r[0] + "?type=MEDICATION").build()).toList());

        @SuppressWarnings("unchecked")
        List<Object[]> supps = em.createQuery(
                "SELECT s.id, s.name FROM Supplement s WHERE s.userId = :userId AND LOWER(s.name) LIKE :pattern ORDER BY s.name")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(sub).getResultList();
        results.addAll(supps.stream().map(r -> SearchResult.builder().category("therapeutics").id((Long) r[0])
                .title((String) r[1]).subtitle("Supplement").url("/therapeutics/" + r[0] + "?type=SUPPLEMENT").build()).toList());

        return results;
    }

    private List<SearchResult> searchVitals(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT v.id, v.vitalType, v.value, v.unit, v.measuredAt FROM VitalReading v " +
                        "WHERE v.userId = :userId AND (LOWER(v.vitalType) LIKE :pattern OR LOWER(v.notes) LIKE :pattern) " +
                        "ORDER BY v.measuredAt DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String type = (String) r[1];
            String label = VITAL_LABELS.getOrDefault(type, humanize(type));
            String val = r[2] != null ? ((BigDecimal) r[2]).toPlainString() : "";
            String unit = r[3] != null ? " " + r[3] : "";
            return SearchResult.builder().category("vitals").id((Long) r[0])
                    .title(label + (val.isEmpty() ? "" : " — " + val + unit))
                    .subtitle(fmtDate(r[4])).url("/vitals").build();
        }).toList();
    }

    private List<SearchResult> searchBodyMetrics(Long userId, String pattern, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                "SELECT b.id, b.metricType, b.value, b.unit, b.measuredAt FROM BodyMetric b " +
                        "WHERE b.userId = :userId AND (LOWER(b.metricType) LIKE :pattern OR LOWER(b.notes) LIKE :pattern) " +
                        "ORDER BY b.measuredAt DESC")
                .setParameter("userId", userId).setParameter("pattern", pattern).setMaxResults(limit).getResultList();

        return rows.stream().map(r -> {
            String type = (String) r[1];
            String label = METRIC_LABELS.getOrDefault(type, humanize(type));
            String val = r[2] != null ? ((BigDecimal) r[2]).toPlainString() : "";
            String unit = r[3] != null ? " " + r[3] : "";
            return SearchResult.builder().category("body_metrics").id((Long) r[0])
                    .title(label + (val.isEmpty() ? "" : " — " + val + unit))
                    .subtitle(fmtDate(r[4])).url("/body-metrics").build();
        }).toList();
    }
}
