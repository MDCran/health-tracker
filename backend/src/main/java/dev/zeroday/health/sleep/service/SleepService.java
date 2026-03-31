package dev.zeroday.health.sleep.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.sleep.dto.SleepEntryRequest;
import dev.zeroday.health.sleep.dto.SleepEntryResponse;
import dev.zeroday.health.sleep.dto.SleepStatsResponse;
import dev.zeroday.health.sleep.model.SleepEntry;
import dev.zeroday.health.sleep.model.SleepInterruption;
import dev.zeroday.health.sleep.repository.SleepEntryRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SleepService {

    private final SleepEntryRepository entryRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Transactional
    public SleepEntryResponse createOrUpdateEntry(SleepEntryRequest request) {
        Long userId = userService.getCurrentUserId();

        SleepEntry entry = entryRepository.findByUserIdAndDate(userId, request.getDate())
                .orElseGet(() -> {
                    SleepEntry newEntry = new SleepEntry();
                    newEntry.setUserId(userId);
                    newEntry.setDate(request.getDate());
                    return newEntry;
                });

        entry.setBedtime(request.getBedtime());
        entry.setWakeTime(request.getWakeTime());
        entry.setSleepQuality(request.getSleepQuality());
        entry.setFeelRested(request.getFeelRested());
        entry.setSleepLatencyMin(request.getSleepLatencyMin());
        entry.setNotes(request.getNotes());

        if (request.getSurveyResponses() != null) {
            try {
                entry.setSurveyResponses(objectMapper.writeValueAsString(request.getSurveyResponses()));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize survey responses", e);
            }
        } else {
            entry.setSurveyResponses(null);
        }

        entry.getInterruptions().clear();

        int interruptionMinutes = 0;
        if (request.getInterruptions() != null) {
            for (SleepEntryRequest.InterruptionRequest ir : request.getInterruptions()) {
                SleepInterruption interruption = new SleepInterruption();
                interruption.setSleepEntry(entry);
                interruption.setWokeAt(ir.getWokeAt());
                interruption.setFellBackAt(ir.getFellBackAt());
                interruption.setReason(ir.getReason());

                int durMin = 0;
                if (ir.getWokeAt() != null && ir.getFellBackAt() != null) {
                    durMin = (int) Duration.between(ir.getWokeAt(), ir.getFellBackAt()).toMinutes();
                }
                interruption.setDurationMin(durMin);
                interruptionMinutes += durMin;

                entry.getInterruptions().add(interruption);
            }
        }

        long timeInBedMin = Duration.between(entry.getBedtime(), entry.getWakeTime()).toMinutes();
        int latency = entry.getSleepLatencyMin() != null ? entry.getSleepLatencyMin() : 0;
        int totalMinutes = (int) Math.max(0, timeInBedMin - latency - interruptionMinutes);
        entry.setTotalMinutes(totalMinutes);

        entry = entryRepository.save(entry);

        Map<String, Object> parsedSurvey = parseSurveyResponses(entry.getSurveyResponses());
        Map<String, Integer> stages = calculateSleepStages(totalMinutes, interruptionMinutes);

        return SleepEntryResponse.from(entry, parsedSurvey, stages);
    }

    @Transactional(readOnly = true)
    public SleepEntryResponse getByDate(LocalDate date) {
        Long userId = userService.getCurrentUserId();
        SleepEntry entry = entryRepository.findByUserIdAndDate(userId, date)
                .orElseThrow(() -> new ResourceNotFoundException("SleepEntry", date.toString()));
        return toResponse(entry);
    }

    @Transactional(readOnly = true)
    public Page<SleepEntryResponse> list(Pageable pageable) {
        Long userId = userService.getCurrentUserId();
        return entryRepository.findByUserIdOrderByDateDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<SleepEntryResponse> listBetween(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        return entryRepository.findByUserIdAndDateBetween(userId, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(LocalDate date) {
        Long userId = userService.getCurrentUserId();
        SleepEntry entry = entryRepository.findByUserIdAndDate(userId, date)
                .orElseThrow(() -> new ResourceNotFoundException("SleepEntry", date.toString()));
        entryRepository.delete(entry);
    }

    @Transactional(readOnly = true)
    public SleepStatsResponse getStats(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        List<SleepEntry> entries = entryRepository.findByUserIdAndDateBetween(userId, from, to);

        if (entries.isEmpty()) {
            return SleepStatsResponse.builder()
                    .avgSleepHours(0)
                    .avgQuality(0)
                    .avgInterruptions(0)
                    .avgLatency(0)
                    .dataPoints(List.of())
                    .build();
        }

        double avgMinutes = entries.stream()
                .mapToInt(e -> e.getTotalMinutes() != null ? e.getTotalMinutes() : 0)
                .average()
                .orElse(0.0);

        double avgQuality = entries.stream()
                .filter(e -> e.getSleepQuality() != null)
                .mapToInt(SleepEntry::getSleepQuality)
                .average()
                .orElse(0.0);

        double avgInterruptions = entries.stream()
                .mapToInt(e -> e.getInterruptions() != null ? e.getInterruptions().size() : 0)
                .average()
                .orElse(0.0);

        double avgLatency = entries.stream()
                .filter(e -> e.getSleepLatencyMin() != null)
                .mapToInt(SleepEntry::getSleepLatencyMin)
                .average()
                .orElse(0.0);

        List<SleepStatsResponse.DataPoint> dataPoints = entries.stream()
                .map(e -> SleepStatsResponse.DataPoint.builder()
                        .date(e.getDate().toString())
                        .hours(Math.round((e.getTotalMinutes() != null ? e.getTotalMinutes() : 0) / 60.0 * 100.0) / 100.0)
                        .quality(e.getSleepQuality() != null ? e.getSleepQuality() : 0)
                        .build())
                .toList();

        return SleepStatsResponse.builder()
                .avgSleepHours(Math.round(avgMinutes / 60.0 * 100.0) / 100.0)
                .avgQuality(Math.round(avgQuality * 100.0) / 100.0)
                .avgInterruptions(Math.round(avgInterruptions * 100.0) / 100.0)
                .avgLatency(Math.round(avgLatency * 100.0) / 100.0)
                .dataPoints(dataPoints)
                .build();
    }

    public Map<String, Integer> calculateSleepStages(int totalMinutes, int interruptionMinutes) {
        int sleepTime = Math.max(0, totalMinutes);
        int light = (int) Math.round(sleepTime * 0.50);
        int deep = (int) Math.round(sleepTime * 0.20);
        int rem = (int) Math.round(sleepTime * 0.25);
        int assigned = light + deep + rem;
        if (assigned < sleepTime) {
            light += (sleepTime - assigned);
        }

        Map<String, Integer> stages = new HashMap<>();
        stages.put("light", light);
        stages.put("deep", deep);
        stages.put("rem", rem);
        stages.put("awake", interruptionMinutes);
        return stages;
    }

    private SleepEntryResponse toResponse(SleepEntry entry) {
        Map<String, Object> parsedSurvey = parseSurveyResponses(entry.getSurveyResponses());
        int interruptionMinutes = entry.getInterruptions() != null
                ? entry.getInterruptions().stream()
                    .mapToInt(i -> i.getDurationMin() != null ? i.getDurationMin() : 0)
                    .sum()
                : 0;
        int totalMin = entry.getTotalMinutes() != null ? entry.getTotalMinutes() : 0;
        Map<String, Integer> stages = calculateSleepStages(totalMin, interruptionMinutes);
        return SleepEntryResponse.from(entry, parsedSurvey, stages);
    }

    private Map<String, Object> parseSurveyResponses(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse survey responses", e);
            return null;
        }
    }
}
