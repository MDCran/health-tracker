package dev.zeroday.health.therapeutics.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.therapeutics.dto.TherapeuticLogRequest;
import dev.zeroday.health.therapeutics.dto.TherapeuticLogResponse;
import dev.zeroday.health.therapeutics.model.TherapeuticLog;
import dev.zeroday.health.therapeutics.repository.TherapeuticLogRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TherapeuticLogService {

    private final TherapeuticLogRepository logRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<TherapeuticLogResponse> getLogs(Instant start, Instant end) {
        Long userId = userService.getCurrentUserId();
        return logRepository.findByUserIdAndTakenAtBetween(userId, start, end).stream()
                .map(TherapeuticLogResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TherapeuticLogResponse> getLogsByType(String therapeuticType, Instant start, Instant end) {
        Long userId = userService.getCurrentUserId();
        return logRepository.findByUserIdAndTherapeuticTypeAndTakenAtBetween(userId, therapeuticType, start, end)
                .stream()
                .map(TherapeuticLogResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TherapeuticLogResponse> getLogsByTherapeutic(String therapeuticType, Long therapeuticId,
                                                              Instant start, Instant end) {
        return logRepository.findByTherapeuticTypeAndTherapeuticIdAndTakenAtBetween(
                        therapeuticType, therapeuticId, start, end)
                .stream()
                .map(TherapeuticLogResponse::from)
                .toList();
    }

    @Transactional
    public TherapeuticLogResponse createLog(TherapeuticLogRequest request) {
        Long userId = userService.getCurrentUserId();

        TherapeuticLog log = new TherapeuticLog();
        log.setUserId(userId);
        log.setTherapeuticType(request.getTherapeuticType());
        log.setTherapeuticId(request.getTherapeuticId());
        log.setScheduleId(request.getScheduleId());
        log.setTakenAt(request.getTakenAt());
        log.setDosageAmount(request.getDosageAmount());
        log.setDosageUnit(request.getDosageUnit());
        log.setNotes(request.getNotes());
        log.setSkipped(request.isSkipped());

        log = logRepository.save(log);
        return TherapeuticLogResponse.from(log);
    }

    @Transactional
    public TherapeuticLogResponse updateLog(Long id, TherapeuticLogRequest request) {
        TherapeuticLog log = findByIdForCurrentUser(id);

        log.setTherapeuticType(request.getTherapeuticType());
        log.setTherapeuticId(request.getTherapeuticId());
        log.setScheduleId(request.getScheduleId());
        log.setTakenAt(request.getTakenAt());
        log.setDosageAmount(request.getDosageAmount());
        log.setDosageUnit(request.getDosageUnit());
        log.setNotes(request.getNotes());
        log.setSkipped(request.isSkipped());

        log = logRepository.save(log);
        return TherapeuticLogResponse.from(log);
    }

    @Transactional
    public void deleteLog(Long id) {
        TherapeuticLog log = findByIdForCurrentUser(id);
        logRepository.delete(log);
    }

    private TherapeuticLog findByIdForCurrentUser(Long id) {
        Long userId = userService.getCurrentUserId();
        return logRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("TherapeuticLog", id));
    }
}
