package dev.zeroday.health.habits.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.habits.dto.*;
import dev.zeroday.health.habits.model.Habit;
import dev.zeroday.health.habits.model.HabitLog;
import dev.zeroday.health.habits.model.HabitMilestone;
import dev.zeroday.health.habits.repository.HabitLogRepository;
import dev.zeroday.health.habits.repository.HabitMilestoneRepository;
import dev.zeroday.health.habits.repository.HabitRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final HabitMilestoneRepository milestoneRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<HabitResponse> listHabits(boolean activeOnly) {
        Long userId = userService.getCurrentUserId();
        List<Habit> habits = activeOnly
                ? habitRepository.findByUserIdAndActiveTrue(userId)
                : habitRepository.findByUserId(userId);

        return habits.stream()
                .map(this::toHabitResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HabitResponse getHabit(Long id) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", id));
        return toHabitResponse(habit);
    }

    @Transactional
    public HabitResponse createHabit(HabitRequest request) {
        Long userId = userService.getCurrentUserId();

        Habit habit = new Habit();
        habit.setUserId(userId);
        habit.setName(request.getName());
        habit.setDescription(request.getDescription());
        habit.setFrequency(request.getFrequency());
        habit.setTargetCount(request.getTargetCount());
        habit.setDaysOfWeek(request.getDaysOfWeek());
        habit.setColor(request.getColor());
        habit.setIcon(request.getIcon());
        habit.setActive(true);
        habit.setHabitType(request.getHabitType() != null ? request.getHabitType() : "GOOD");
        habit.setTargetDays(request.getTargetDays() != null ? request.getTargetDays() : 66);
        habit.setCategory(request.getCategory());
        habit.setCue(request.getCue());
        habit.setRoutine(request.getRoutine());
        habit.setReward(request.getReward());
        habit.setStackAfterHabitId(request.getStackAfterHabitId());
        habit.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM");
        habit.setPriority(request.getPriority());
        habit.setReminderTime(request.getReminderTime());

        habit = habitRepository.save(habit);
        return toHabitResponse(habit);
    }

    @Transactional
    public HabitResponse updateHabit(Long id, HabitRequest request) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", id));

        if (request.getName() != null) habit.setName(request.getName());
        if (request.getDescription() != null) habit.setDescription(request.getDescription());
        if (request.getFrequency() != null) habit.setFrequency(request.getFrequency());
        if (request.getTargetCount() != null) habit.setTargetCount(request.getTargetCount());
        if (request.getDaysOfWeek() != null) habit.setDaysOfWeek(request.getDaysOfWeek());
        if (request.getColor() != null) habit.setColor(request.getColor());
        if (request.getIcon() != null) habit.setIcon(request.getIcon());
        if (request.getHabitType() != null) habit.setHabitType(request.getHabitType());
        if (request.getTargetDays() != null) habit.setTargetDays(request.getTargetDays());
        if (request.getCategory() != null) habit.setCategory(request.getCategory());
        if (request.getCue() != null) habit.setCue(request.getCue());
        if (request.getRoutine() != null) habit.setRoutine(request.getRoutine());
        if (request.getReward() != null) habit.setReward(request.getReward());
        if (request.getStackAfterHabitId() != null) habit.setStackAfterHabitId(request.getStackAfterHabitId());
        if (request.getDifficulty() != null) habit.setDifficulty(request.getDifficulty());
        if (request.getPriority() != null) habit.setPriority(request.getPriority());
        if (request.getReminderTime() != null) habit.setReminderTime(request.getReminderTime());
        if (request.getActive() != null) habit.setActive(request.getActive());

        habit = habitRepository.save(habit);
        return toHabitResponse(habit);
    }

    @Transactional
    public void deleteHabit(Long id) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", id));
        habit.setActive(false);
        habitRepository.save(habit);
    }

    @Transactional
    public HabitLogResponse logCompletion(Long habitId, LocalDate date, String notes) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", habitId));

        HabitLogResponse response = habitLogRepository.findByHabitIdAndDate(habitId, date)
                .map(existing -> {
                    existing.setCompleted(true);
                    if (notes != null) existing.setNotes(notes);
                    return HabitLogResponse.from(habitLogRepository.save(existing));
                })
                .orElseGet(() -> {
                    HabitLog log = new HabitLog();
                    log.setHabit(habitRepository.getReferenceById(habitId));
                    log.setDate(date);
                    log.setCompleted(true);
                    log.setNotes(notes);
                    return HabitLogResponse.from(habitLogRepository.save(log));
                });

        checkMilestones(habit);
        return response;
    }

    @Transactional
    public void removeLog(Long habitId, LocalDate date) {
        habitLogRepository.findByHabitIdAndDate(habitId, date)
                .ifPresent(habitLogRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<HabitLogResponse> getHistory(Long habitId, LocalDate from, LocalDate to) {
        habitRepository.findById(habitId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", habitId));

        return habitLogRepository.findByHabitIdAndDateBetween(habitId, from, to)
                .stream()
                .map(HabitLogResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DailyHabitStatusResponse> getDailyStatus(LocalDate date) {
        Long userId = userService.getCurrentUserId();
        List<Habit> activeHabits = habitRepository.findByUserIdAndActiveTrue(userId);

        return activeHabits.stream()
                .map(habit -> {
                    boolean completed = habitLogRepository.findByHabitIdAndDate(habit.getId(), date)
                            .map(HabitLog::isCompleted)
                            .orElse(false);

                    boolean isBad = "BAD".equals(habit.getHabitType());
                    int streak = calculateCurrentStreak(habit.getId());
                    int daysSince = isBad ? calculateDaysSinceLastOccurrence(habit.getId()) : -1;
                    int streakForProgress = isBad ? daysSince : streak;
                    double progress = habit.getTargetDays() > 0 && streakForProgress >= 0
                            ? Math.min(100.0, (streakForProgress * 100.0) / habit.getTargetDays())
                            : 0.0;

                    return DailyHabitStatusResponse.builder()
                            .habitId(habit.getId())
                            .habitName(habit.getName())
                            .habitType(habit.getHabitType())
                            .completed(completed)
                            .currentStreak(streak)
                            .daysSinceLastOccurrence(daysSince)
                            .formationProgress(progress)
                            .targetDays(habit.getTargetDays())
                            .color(habit.getColor())
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HabitMilestoneResponse> getMilestones(Long habitId) {
        habitRepository.findById(habitId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", habitId));

        return milestoneRepository.findByHabitIdOrderByAchievedAtDesc(habitId)
                .stream()
                .map(HabitMilestoneResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public int calculateCurrentStreak(Long habitId) {
        List<HabitLog> logs = habitLogRepository.findByHabitIdOrderByDateDesc(habitId);
        int streak = 0;
        LocalDate expectedDate = LocalDate.now();

        for (HabitLog log : logs) {
            if (!log.isCompleted()) {
                if (log.getDate().equals(expectedDate)) {
                    if (streak == 0) {
                        expectedDate = expectedDate.minusDays(1);
                        continue;
                    }
                    break;
                }
                continue;
            }

            if (log.getDate().equals(expectedDate)) {
                streak++;
                expectedDate = expectedDate.minusDays(1);
            } else if (log.getDate().isBefore(expectedDate)) {
                break;
            }
        }

        return streak;
    }

    @Transactional(readOnly = true)
    public int calculateLongestStreak(Long habitId) {
        List<HabitLog> logs = habitLogRepository.findByHabitIdOrderByDateDesc(habitId);
        int longestStreak = 0;
        int currentStreak = 0;
        LocalDate previousDate = null;

        List<HabitLog> chronological = logs.reversed();

        for (HabitLog log : chronological) {
            if (!log.isCompleted()) {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 0;
                previousDate = null;
                continue;
            }

            if (previousDate == null || log.getDate().equals(previousDate.plusDays(1))) {
                currentStreak++;
                previousDate = log.getDate();
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
                previousDate = log.getDate();
            }
        }

        return Math.max(longestStreak, currentStreak);
    }

    @Transactional(readOnly = true)
    public double getCompletionRate(Long habitId) {
        List<HabitLog> logs = habitLogRepository.findByHabitIdOrderByDateDesc(habitId);
        if (logs.isEmpty()) return 0.0;

        long completed = logs.stream().filter(HabitLog::isCompleted).count();
        return (double) completed / logs.size() * 100.0;
    }


    private void checkMilestones(Habit habit) {
        int[] thresholds = {7, 14, 21, 30, 60, 66, 90, 100, 180, 365};
        boolean isBad = "BAD".equals(habit.getHabitType());
        int progress = isBad
                ? calculateDaysSinceLastOccurrence(habit.getId())
                : calculateCurrentStreak(habit.getId());

        for (int threshold : thresholds) {
            if (progress >= threshold) {
                String type = isBad ? "CLEAN_DAYS" : "STREAK";
                if (!milestoneRepository.existsByHabitIdAndMilestoneTypeAndMilestoneValue(
                        habit.getId(), type, threshold)) {
                    HabitMilestone m = new HabitMilestone();
                    m.setHabitId(habit.getId());
                    m.setMilestoneType(type);
                    m.setMilestoneValue(threshold);
                    m.setAchievedAt(java.time.LocalDate.now());
                    milestoneRepository.save(m);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public int calculateDaysSinceLastOccurrence(Long habitId) {
        List<HabitLog> logs = habitLogRepository.findByHabitIdOrderByDateDesc(habitId);
        for (HabitLog log : logs) {
            if (log.isCompleted()) {
                return (int) java.time.temporal.ChronoUnit.DAYS.between(log.getDate(), LocalDate.now());
            }
        }
        return -1;
    }

    @Transactional(readOnly = true)
    public int getTotalOccurrences(Long habitId) {
        List<HabitLog> logs = habitLogRepository.findByHabitIdOrderByDateDesc(habitId);
        return (int) logs.stream().filter(HabitLog::isCompleted).count();
    }

    private HabitResponse toHabitResponse(Habit habit) {
        boolean isBad = "BAD".equals(habit.getHabitType());
        int daysSince = isBad ? calculateDaysSinceLastOccurrence(habit.getId()) : -1;
        int total = isBad ? getTotalOccurrences(habit.getId()) : 0;

        return HabitResponse.from(
                habit,
                calculateCurrentStreak(habit.getId()),
                calculateLongestStreak(habit.getId()),
                getCompletionRate(habit.getId()),
                daysSince,
                total
        );
    }
}
