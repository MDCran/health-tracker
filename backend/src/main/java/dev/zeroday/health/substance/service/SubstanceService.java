package dev.zeroday.health.substance.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.substance.dto.*;
import dev.zeroday.health.substance.model.CustomSubstanceType;
import dev.zeroday.health.substance.model.SubstanceLog;
import dev.zeroday.health.substance.repository.CustomSubstanceTypeRepository;
import dev.zeroday.health.substance.repository.SubstanceLogRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubstanceService {

    private final SubstanceLogRepository logRepository;
    private final CustomSubstanceTypeRepository customTypeRepository;
    private final UserService userService;

    @Transactional
    public SubstanceLogResponse logOccurrence(SubstanceLogRequest request) {
        Long userId = userService.getCurrentUserId();

        SubstanceLog log = new SubstanceLog();
        log.setUserId(userId);
        log.setSubstanceType(request.getSubstanceType().toUpperCase());
        log.setOccurredAt(request.getOccurredAt());
        log.setAmount(request.getAmount());
        log.setNotes(request.getNotes());
        log.setContext(request.getContext());
        log.setMoodBefore(request.getMoodBefore());
        log.setMoodAfter(request.getMoodAfter());

        log = logRepository.save(log);
        return SubstanceLogResponse.from(log);
    }

    @Transactional(readOnly = true)
    public List<SubstanceLogResponse> list(String substanceType, Instant from, Instant to) {
        Long userId = userService.getCurrentUserId();

        List<SubstanceLog> logs;

        if (substanceType != null && from != null && to != null) {
            logs = logRepository.findByUserIdAndSubstanceTypeAndOccurredAtBetween(
                    userId, substanceType.toUpperCase(), from, to);
        } else if (substanceType != null) {
            logs = logRepository.findByUserIdAndSubstanceTypeOrderByOccurredAtDesc(
                    userId, substanceType.toUpperCase());
        } else {
            logs = logRepository.findByUserIdOrderByOccurredAtDesc(userId);
        }

        return logs.stream()
                .map(SubstanceLogResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubstanceLogResponse getById(Long id) {
        Long userId = userService.getCurrentUserId();
        SubstanceLog log = logRepository.findById(id)
                .filter(l -> l.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("SubstanceLog", id));
        return SubstanceLogResponse.from(log);
    }

    @Transactional
    public SubstanceLogResponse update(Long id, SubstanceLogUpdateRequest request) {
        Long userId = userService.getCurrentUserId();
        SubstanceLog log = logRepository.findById(id)
                .filter(l -> l.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("SubstanceLog", id));

        if (request.getSubstanceType() != null) log.setSubstanceType(request.getSubstanceType().toUpperCase());
        if (request.getOccurredAt() != null) log.setOccurredAt(request.getOccurredAt());
        if (request.getAmount() != null) log.setAmount(request.getAmount());
        if (request.getNotes() != null) log.setNotes(request.getNotes());
        if (request.getContext() != null) log.setContext(request.getContext());
        if (request.getMoodBefore() != null) log.setMoodBefore(request.getMoodBefore());
        if (request.getMoodAfter() != null) log.setMoodAfter(request.getMoodAfter());

        log = logRepository.save(log);
        return SubstanceLogResponse.from(log);
    }

    @Transactional
    public void delete(Long id) {
        Long userId = userService.getCurrentUserId();
        SubstanceLog log = logRepository.findById(id)
                .filter(l -> l.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("SubstanceLog", id));
        logRepository.delete(log);
    }

    @Transactional(readOnly = true)
    public SubstanceStatsResponse getStats(String substanceType) {
        Long userId = userService.getCurrentUserId();
        String type = substanceType.toUpperCase();
        Instant now = Instant.now();

        long daysSinceLast = logRepository.findTopByUserIdAndSubstanceTypeOrderByOccurredAtDesc(userId, type)
                .map(log -> ChronoUnit.DAYS.between(log.getOccurredAt(), now))
                .orElse(-1L);

        long totalOccurrences = logRepository.countByUserIdAndSubstanceType(userId, type);

        Instant weekStart = LocalDate.now().with(DayOfWeek.MONDAY)
                .atStartOfDay(ZoneOffset.UTC).toInstant();
        long occurrencesThisWeek = logRepository.countByUserIdAndSubstanceTypeAndOccurredAtBetween(
                userId, type, weekStart, now);

        Instant monthStart = LocalDate.now().withDayOfMonth(1)
                .atStartOfDay(ZoneOffset.UTC).toInstant();
        long occurrencesThisMonth = logRepository.countByUserIdAndSubstanceTypeAndOccurredAtBetween(
                userId, type, monthStart, now);

        List<SubstanceLog> allLogs = logRepository
                .findByUserIdAndSubstanceTypeOrderByOccurredAtDesc(userId, type)
                .stream()
                .sorted(Comparator.comparing(SubstanceLog::getOccurredAt))
                .toList();

        double avgMoodBefore = allLogs.stream()
                .filter(l -> l.getMoodBefore() != null)
                .mapToInt(SubstanceLog::getMoodBefore)
                .average()
                .orElse(0.0);

        double avgMoodAfter = allLogs.stream()
                .filter(l -> l.getMoodAfter() != null)
                .mapToInt(SubstanceLog::getMoodAfter)
                .average()
                .orElse(0.0);

        long currentCleanStreak = daysSinceLast >= 0 ? daysSinceLast : 0;
        long longestCleanStreak = calculateLongestCleanStreak(allLogs, now);

        List<SubstanceStatsResponse.WeeklyCount> weeklyTrend = calculateWeeklyTrend(userId, type, now);

        return SubstanceStatsResponse.builder()
                .substanceType(type)
                .daysSinceLast(daysSinceLast >= 0 ? daysSinceLast : 0)
                .totalOccurrences(totalOccurrences)
                .occurrencesThisWeek(occurrencesThisWeek)
                .occurrencesThisMonth(occurrencesThisMonth)
                .avgMoodBefore(Math.round(avgMoodBefore * 100.0) / 100.0)
                .avgMoodAfter(Math.round(avgMoodAfter * 100.0) / 100.0)
                .longestCleanStreak(longestCleanStreak)
                .currentCleanStreak(currentCleanStreak)
                .weeklyTrend(weeklyTrend)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SubstanceStatsResponse> getAllStats() {
        Long userId = userService.getCurrentUserId();
        List<String> types = logRepository.findDistinctSubstanceTypesByUserId(userId);

        return types.stream()
                .map(this::getStats)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getLoggedTypes() {
        Long userId = userService.getCurrentUserId();
        return logRepository.findDistinctSubstanceTypesByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<CustomSubstanceTypeResponse> getCustomTypes() {
        Long userId = userService.getCurrentUserId();
        return customTypeRepository.findByUserId(userId).stream()
                .map(CustomSubstanceTypeResponse::from)
                .toList();
    }

    @Transactional
    public CustomSubstanceTypeResponse createCustomType(CustomSubstanceTypeRequest request) {
        Long userId = userService.getCurrentUserId();
        String key = "CUSTOM_" + request.getName().toUpperCase()
                .replaceAll("[^A-Z0-9]", "_")
                .replaceAll("_+", "_");

        CustomSubstanceType existing = customTypeRepository.findByUserIdAndKey(userId, key).orElse(null);
        if (existing != null) {
            existing.setName(request.getName());
            if (request.getColor() != null) existing.setColor(request.getColor());
            return CustomSubstanceTypeResponse.from(customTypeRepository.save(existing));
        }

        CustomSubstanceType entity = new CustomSubstanceType();
        entity.setUserId(userId);
        entity.setKey(key);
        entity.setName(request.getName());
        entity.setColor(request.getColor() != null ? request.getColor() : "#64748b");
        return CustomSubstanceTypeResponse.from(customTypeRepository.save(entity));
    }

    @Transactional
    public void deleteCustomType(Long id) {
        Long userId = userService.getCurrentUserId();
        CustomSubstanceType entity = customTypeRepository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("CustomSubstanceType", id));
        customTypeRepository.delete(entity);
    }

    private long calculateLongestCleanStreak(List<SubstanceLog> sortedLogs, Instant now) {
        if (sortedLogs.isEmpty()) {
            return 0;
        }

        long longestGap = 0;

        for (int i = 1; i < sortedLogs.size(); i++) {
            long gap = ChronoUnit.DAYS.between(
                    sortedLogs.get(i - 1).getOccurredAt(),
                    sortedLogs.get(i).getOccurredAt());
            longestGap = Math.max(longestGap, gap);
        }

        long currentGap = ChronoUnit.DAYS.between(
                sortedLogs.get(sortedLogs.size() - 1).getOccurredAt(), now);
        longestGap = Math.max(longestGap, currentGap);

        return longestGap;
    }

    private List<SubstanceStatsResponse.WeeklyCount> calculateWeeklyTrend(
            Long userId, String type, Instant now) {
        List<SubstanceStatsResponse.WeeklyCount> trend = new ArrayList<>();
        DateTimeFormatter weekFormatter = DateTimeFormatter.ofPattern("MMM d");

        for (int i = 11; i >= 0; i--) {
            LocalDate weekEnd = LocalDate.now().minusWeeks(i);
            LocalDate weekStart = weekEnd.minusDays(6);

            Instant from = weekStart.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant to = weekEnd.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

            long count = logRepository.countByUserIdAndSubstanceTypeAndOccurredAtBetween(
                    userId, type, from, to);

            String label = weekStart.format(weekFormatter);

            trend.add(SubstanceStatsResponse.WeeklyCount.builder()
                    .week(label)
                    .count(count)
                    .build());
        }

        return trend;
    }
}
