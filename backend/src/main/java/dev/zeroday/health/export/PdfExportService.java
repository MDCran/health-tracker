package dev.zeroday.health.export;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.io.font.constants.StandardFonts;
import dev.zeroday.health.appointment.repository.AppointmentRepository;
import dev.zeroday.health.habits.model.Habit;
import dev.zeroday.health.habits.model.HabitLog;
import dev.zeroday.health.habits.repository.HabitLogRepository;
import dev.zeroday.health.habits.repository.HabitRepository;
import dev.zeroday.health.metrics.model.BodyMetric;
import dev.zeroday.health.metrics.repository.BodyMetricRepository;
import dev.zeroday.health.nutrition.model.NutritionDay;
import dev.zeroday.health.nutrition.repository.NutritionDayRepository;
import dev.zeroday.health.sleep.model.SleepEntry;
import dev.zeroday.health.sleep.repository.SleepEntryRepository;
import dev.zeroday.health.substance.model.SubstanceLog;
import dev.zeroday.health.substance.repository.SubstanceLogRepository;
import dev.zeroday.health.vitals.model.VitalReading;
import dev.zeroday.health.vitals.repository.VitalReadingRepository;
import dev.zeroday.health.user.User;
import dev.zeroday.health.user.UserProfile;
import dev.zeroday.health.user.UserProfileRepository;
import dev.zeroday.health.user.UserRepository;
import dev.zeroday.health.user.UserService;
import dev.zeroday.health.workout.model.ExerciseSet;
import dev.zeroday.health.workout.model.WorkoutExercise;
import dev.zeroday.health.workout.model.WorkoutSession;
import dev.zeroday.health.workout.repository.PersonalRecordRepository;
import dev.zeroday.health.workout.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final PersonalRecordRepository personalRecordRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final NutritionDayRepository nutritionDayRepository;
    private final SleepEntryRepository sleepEntryRepository;
    private final BodyMetricRepository bodyMetricRepository;
    private final SubstanceLogRepository substanceLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final VitalReadingRepository vitalReadingRepository;

    private static final DeviceRgb PRIMARY = new DeviceRgb(124, 58, 237);
    private static final DeviceRgb HEADER_BG = new DeviceRgb(245, 243, 255);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM d, yyyy");
    private static final DateTimeFormatter DATE_SHORT = DateTimeFormatter.ofPattern("MM/dd");

    @Transactional(readOnly = true)
    public byte[] generatePdf(List<String> sections, LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document doc = new Document(pdfDoc);
            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            doc.setFont(regular).setFontSize(10);

            doc.add(new Paragraph("Health Report")
                    .setFont(bold).setFontSize(28).setFontColor(PRIMARY)
                    .setTextAlignment(TextAlignment.CENTER).setMarginTop(100));
            String name = profile != null && profile.getFirstName() != null
                    ? profile.getFirstName() + (profile.getLastName() != null ? " " + profile.getLastName() : "")
                    : user.getUsername();
            doc.add(new Paragraph(name)
                    .setFontSize(16).setTextAlignment(TextAlignment.CENTER).setMarginTop(10));
            doc.add(new Paragraph(from.format(DATE_FMT) + " — " + to.format(DATE_FMT))
                    .setFontSize(12).setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER).setMarginTop(5));
            doc.add(new Paragraph("Generated " + LocalDate.now().format(DATE_FMT))
                    .setFontSize(9).setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER).setMarginTop(30));

            for (String section : sections) {
                doc.add(new AreaBreak());
                switch (section.toUpperCase()) {
                    case "WORKOUTS" -> addWorkouts(doc, bold, userId, from, to);
                    case "HABITS" -> addHabits(doc, bold, userId, from, to);
                    case "NUTRITION" -> addNutrition(doc, bold, userId, from, to);
                    case "SLEEP" -> addSleep(doc, bold, userId, from, to);
                    case "THERAPEUTICS" -> addTherapeutics(doc, bold, userId);
                    case "VITALS" -> addVitals(doc, bold, userId, from, to);
                    case "BODY_METRICS" -> addBodyMetrics(doc, bold, userId, from, to);
                    case "APPOINTMENTS" -> addAppointments(doc, bold, userId, from, to);
                    case "SOBER_TRACKER" -> addSoberTracker(doc, bold, userId, from, to);
                    case "JOURNAL" -> addJournal(doc, bold, userId, from, to);
                    default -> doc.add(new Paragraph("Section: " + section).setFont(bold));
                }
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("PDF generation failed", e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private void sectionTitle(Document doc, PdfFont bold, String title) {
        doc.add(new Paragraph(title)
                .setFont(bold).setFontSize(20).setFontColor(PRIMARY).setMarginBottom(10));
        doc.add(new Paragraph("").setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(ColorConstants.LIGHT_GRAY, 1)).setMarginBottom(15));
    }

    private void addWorkouts(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Workouts");
        List<WorkoutSession> sessions = workoutSessionRepository.findByUserIdOrderByDateDesc(userId, PageRequest.of(0, 200)).getContent();
        sessions = sessions.stream().filter(s -> !s.getDate().isBefore(from) && !s.getDate().isAfter(to)).toList();

        doc.add(new Paragraph("Total sessions: " + sessions.size()).setFontSize(11).setMarginBottom(8));

        for (WorkoutSession s : sessions) {
            doc.add(new Paragraph((s.getName() != null ? s.getName() : "Workout") + " — " + s.getDate().format(DATE_FMT))
                    .setFont(bold).setFontSize(11).setMarginTop(8));
            if (s.getDurationSeconds() != null) {
                doc.add(new Paragraph("Duration: " + (s.getDurationSeconds() / 60) + " min").setFontSize(9).setFontColor(ColorConstants.GRAY));
            }
            try {
                List<WorkoutExercise> exercises = s.getExercises();
                for (WorkoutExercise ex : exercises) {
                    String exName = ex.getExercise().getName();
                    doc.add(new Paragraph("  " + exName).setFontSize(10).setMarginTop(3));
                    List<ExerciseSet> sets = ex.getSets();
                    for (ExerciseSet set : sets) {
                        String setInfo = "    Set " + set.getSetNumber() + ": "
                                + (set.getWeightKg() != null ? set.getWeightKg() + "kg" : "")
                                + (set.getReps() != null ? " x " + set.getReps() + " reps" : "");
                        doc.add(new Paragraph(setInfo).setFontSize(9).setFontColor(ColorConstants.DARK_GRAY));
                    }
                }
            } catch (Exception ignored) {  }
        }

        var prs = personalRecordRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 50)).getContent();
        if (!prs.isEmpty()) {
            doc.add(new Paragraph("Personal Records").setFont(bold).setFontSize(13).setMarginTop(15));
            Table prTable = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2, 2})).useAllAvailableWidth();
            prTable.addHeaderCell(headerCell("Exercise", bold));
            prTable.addHeaderCell(headerCell("Type", bold));
            prTable.addHeaderCell(headerCell("Value", bold));
            prTable.addHeaderCell(headerCell("Date", bold));
            prs.forEach(pr -> {
                prTable.addCell(cell(pr.getExercise().getName()));
                prTable.addCell(cell(pr.getRecordType()));
                prTable.addCell(cell(pr.getValue() + " " + pr.getUnit()));
                prTable.addCell(cell(pr.getAchievedAt().format(DATE_SHORT)));
            });
            doc.add(prTable);
        }
    }

    private void addHabits(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Habits");
        List<Habit> habits = habitRepository.findByUserId(userId);

        for (Habit h : habits) {
            String type = "GOOD".equals(h.getHabitType()) ? "Build" : "Break";
            doc.add(new Paragraph(h.getName() + " (" + type + ")")
                    .setFont(bold).setFontSize(11).setMarginTop(8));
            if (h.getDescription() != null) doc.add(new Paragraph(h.getDescription()).setFontSize(9).setFontColor(ColorConstants.GRAY));
            doc.add(new Paragraph("Frequency: " + h.getFrequency() + " | Target: " + h.getTargetDays() + " days | Active: " + h.isActive())
                    .setFontSize(9));
            if (h.getCue() != null) doc.add(new Paragraph("Cue: " + h.getCue() + " | Routine: " + h.getRoutine() + " | Reward: " + h.getReward()).setFontSize(9));

            List<HabitLog> logs = habitLogRepository.findByHabitIdAndDateBetween(h.getId(), from, to);
            long completed = logs.stream().filter(HabitLog::isCompleted).count();
            doc.add(new Paragraph("Completions in period: " + completed + "/" + logs.size()).setFontSize(9));
        }
    }

    private void addNutrition(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Nutrition");
        List<NutritionDay> days = nutritionDayRepository.findByUserIdAndDateBetween(userId, from, to);

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1, 1})).useAllAvailableWidth();
        table.addHeaderCell(headerCell("Date", bold));
        table.addHeaderCell(headerCell("Calories", bold));
        table.addHeaderCell(headerCell("Protein", bold));
        table.addHeaderCell(headerCell("Carbs", bold));
        table.addHeaderCell(headerCell("Fat", bold));

        for (NutritionDay day : days) {
            int cal = 0; double pro = 0, carb = 0, fat = 0;
            if (day.getMeals() != null) {
                for (var meal : day.getMeals()) {
                    if (meal.getFoodEntries() != null) {
                        for (var food : meal.getFoodEntries()) {
                            cal += food.getCalories() != null ? food.getCalories() : 0;
                            pro += food.getProteinG() != null ? food.getProteinG().doubleValue() : 0;
                            carb += food.getCarbsG() != null ? food.getCarbsG().doubleValue() : 0;
                            fat += food.getFatG() != null ? food.getFatG().doubleValue() : 0;
                        }
                    }
                }
            }
            table.addCell(cell(day.getDate().format(DATE_SHORT)));
            table.addCell(cell(String.valueOf(cal)));
            table.addCell(cell(String.format("%.0fg", pro)));
            table.addCell(cell(String.format("%.0fg", carb)));
            table.addCell(cell(String.format("%.0fg", fat)));
        }
        doc.add(table);
    }

    private void addSleep(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Sleep");
        List<SleepEntry> entries = sleepEntryRepository.findByUserIdAndDateBetween(userId, from, to);

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1, 1})).useAllAvailableWidth();
        table.addHeaderCell(headerCell("Date", bold));
        table.addHeaderCell(headerCell("Hours", bold));
        table.addHeaderCell(headerCell("Quality", bold));
        table.addHeaderCell(headerCell("Rested", bold));
        table.addHeaderCell(headerCell("Latency", bold));

        for (SleepEntry e : entries) {
            table.addCell(cell(e.getDate().format(DATE_SHORT)));
            table.addCell(cell(e.getTotalMinutes() != null ? String.format("%.1f", e.getTotalMinutes() / 60.0) : "--"));
            table.addCell(cell(e.getSleepQuality() != null ? e.getSleepQuality() + "/10" : "--"));
            table.addCell(cell(e.getFeelRested() != null ? e.getFeelRested() + "/10" : "--"));
            table.addCell(cell(e.getSleepLatencyMin() != null ? e.getSleepLatencyMin() + "m" : "--"));
        }
        doc.add(table);
    }

    private void addTherapeutics(Document doc, PdfFont bold, Long userId) {
        sectionTitle(doc, bold, "Therapeutics");
        doc.add(new Paragraph("See therapeutics section in the app for full schedule details.").setFontSize(10));
    }

    private void addVitals(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Vitals");
        var readings = vitalReadingRepository.findByUserIdOrderByMeasuredAtDesc(userId);
        readings = readings.stream().filter(v -> {
            var d = v.getMeasuredAt().atZone(java.time.ZoneOffset.UTC).toLocalDate();
            return !d.isBefore(from) && !d.isAfter(to);
        }).toList();

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 1.5f, 1.5f, 2})).useAllAvailableWidth();
        table.addHeaderCell(headerCell("Date", bold));
        table.addHeaderCell(headerCell("Vital", bold));
        table.addHeaderCell(headerCell("Value", bold));
        table.addHeaderCell(headerCell("Unit", bold));
        table.addHeaderCell(headerCell("Notes", bold));

        for (VitalReading v : readings) {
            table.addCell(cell(v.getMeasuredAt().atZone(java.time.ZoneOffset.UTC).toLocalDate().format(DATE_SHORT)));
            table.addCell(cell(v.getVitalType()));
            String val = v.getValue().toPlainString();
            if (v.getValue2() != null) val += "/" + v.getValue2().toPlainString();
            table.addCell(cell(val));
            table.addCell(cell(v.getUnit() != null ? v.getUnit() : ""));
            table.addCell(cell(v.getNotes() != null ? v.getNotes() : ""));
        }
        doc.add(table);
    }

    private void addBodyMetrics(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Body Metrics");
        var metrics = bodyMetricRepository.findByUserIdOrderByMeasuredAtDesc(userId, PageRequest.of(0, 500)).getContent();
        metrics = metrics.stream().filter(m -> {
            var d = m.getMeasuredAt().atZone(java.time.ZoneOffset.UTC).toLocalDate();
            return !d.isBefore(from) && !d.isAfter(to);
        }).toList();

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 1, 1})).useAllAvailableWidth();
        table.addHeaderCell(headerCell("Date", bold));
        table.addHeaderCell(headerCell("Metric", bold));
        table.addHeaderCell(headerCell("Value", bold));
        table.addHeaderCell(headerCell("Unit", bold));

        for (BodyMetric m : metrics) {
            table.addCell(cell(m.getMeasuredAt().atZone(java.time.ZoneOffset.UTC).toLocalDate().format(DATE_SHORT)));
            table.addCell(cell(m.getMetricType()));
            table.addCell(cell(m.getValue().toPlainString()));
            table.addCell(cell(m.getUnit() != null ? m.getUnit() : ""));
        }
        doc.add(table);
    }

    private void addAppointments(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Appointments");
        var appointments = appointmentRepository.findByUserIdAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(userId, from, to);

        for (var a : appointments) {
            doc.add(new Paragraph(a.getTitle() + " — " + a.getAppointmentDate().format(DATE_FMT)
                    + (a.getAppointmentTime() != null ? " at " + a.getAppointmentTime().toString().substring(0, 5) : ""))
                    .setFont(bold).setFontSize(11).setMarginTop(8));
            if (a.getDoctorName() != null) doc.add(new Paragraph("Doctor: " + a.getDoctorName()).setFontSize(9));
            if (a.getSpecialty() != null) doc.add(new Paragraph("Specialty: " + a.getSpecialty()).setFontSize(9));
            if (a.getLocation() != null) doc.add(new Paragraph("Location: " + a.getLocation()).setFontSize(9));
            if (a.getNotes() != null) doc.add(new Paragraph("Notes: " + a.getNotes()).setFontSize(9).setFontColor(ColorConstants.GRAY));
        }
    }

    private void addSoberTracker(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Sober Tracker");
        List<SubstanceLog> logs = substanceLogRepository.findByUserIdOrderByOccurredAtDesc(userId);
        logs = logs.stream().filter(l -> {
            var d = l.getOccurredAt().atZone(java.time.ZoneOffset.UTC).toLocalDate();
            return !d.isBefore(from) && !d.isAfter(to);
        }).toList();

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 1, 1})).useAllAvailableWidth();
        table.addHeaderCell(headerCell("Date", bold));
        table.addHeaderCell(headerCell("Type", bold));
        table.addHeaderCell(headerCell("Amount", bold));
        table.addHeaderCell(headerCell("Mood Before", bold));
        table.addHeaderCell(headerCell("Mood After", bold));

        for (SubstanceLog l : logs) {
            table.addCell(cell(l.getOccurredAt().atZone(java.time.ZoneOffset.UTC).toLocalDate().format(DATE_SHORT)));
            table.addCell(cell(l.getSubstanceType()));
            table.addCell(cell(l.getAmount() != null ? l.getAmount() : "--"));
            table.addCell(cell(l.getMoodBefore() != null ? String.valueOf(l.getMoodBefore()) : "--"));
            table.addCell(cell(l.getMoodAfter() != null ? String.valueOf(l.getMoodAfter()) : "--"));
        }
        doc.add(table);
    }

    private void addJournal(Document doc, PdfFont bold, Long userId, LocalDate from, LocalDate to) {
        sectionTitle(doc, bold, "Journal");
        doc.add(new Paragraph("Journal entries are available in the app.").setFontSize(10));
    }

    private Cell headerCell(String text, PdfFont bold) {
        return new Cell().add(new Paragraph(text).setFont(bold).setFontSize(9))
                .setBackgroundColor(HEADER_BG).setPadding(5);
    }

    private Cell cell(String text) {
        return new Cell().add(new Paragraph(text != null ? text : "--").setFontSize(9)).setPadding(4);
    }
}
