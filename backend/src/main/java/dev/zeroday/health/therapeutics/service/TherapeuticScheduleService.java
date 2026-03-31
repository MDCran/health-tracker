package dev.zeroday.health.therapeutics.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.therapeutics.dto.ScheduleRequest;
import dev.zeroday.health.therapeutics.dto.ScheduleResponse;
import dev.zeroday.health.therapeutics.model.TherapeuticSchedule;
import dev.zeroday.health.therapeutics.repository.TherapeuticScheduleRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TherapeuticScheduleService {

    private final TherapeuticScheduleRepository scheduleRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getActiveSchedules() {
        Long userId = userService.getCurrentUserId();
        return scheduleRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getActiveSchedulesByType(String therapeuticType) {
        Long userId = userService.getCurrentUserId();
        return scheduleRepository.findByUserIdAndActiveTrueAndTherapeuticType(userId, therapeuticType).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getSchedule(Long id) {
        TherapeuticSchedule schedule = findByIdForCurrentUser(id);
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public ScheduleResponse createSchedule(ScheduleRequest request) {
        Long userId = userService.getCurrentUserId();

        TherapeuticSchedule schedule = new TherapeuticSchedule();
        schedule.setUserId(userId);
        applyRequest(schedule, request);
        schedule.setActive(true);

        schedule = scheduleRepository.save(schedule);
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public ScheduleResponse updateSchedule(Long id, ScheduleRequest request) {
        TherapeuticSchedule schedule = findByIdForCurrentUser(id);
        applyRequest(schedule, request);

        schedule = scheduleRepository.save(schedule);
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public void deleteSchedule(Long id) {
        TherapeuticSchedule schedule = findByIdForCurrentUser(id);
        schedule.setActive(false);
        scheduleRepository.save(schedule);
    }


    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesForDateRange(LocalDate startDate, LocalDate endDate) {
        Long userId = userService.getCurrentUserId();
        List<TherapeuticSchedule> activeSchedules = scheduleRepository.findByUserIdAndActiveTrue(userId);
        List<ScheduleResponse> expandedSchedules = new ArrayList<>();

        for (TherapeuticSchedule schedule : activeSchedules) {
            if (isScheduleActiveInRange(schedule, startDate, endDate)) {
                LocalDate current = startDate.isBefore(effectiveStart(schedule)) ?
                        effectiveStart(schedule) : startDate;
                LocalDate rangeEnd = endDate.isAfter(effectiveEnd(schedule)) ?
                        effectiveEnd(schedule) : endDate;

                while (!current.isAfter(rangeEnd)) {
                    if (isScheduledOnDate(schedule, current)) {
                        expandedSchedules.add(ScheduleResponse.from(schedule));
                    }
                    current = current.plusDays(1);
                }
            }
        }

        return expandedSchedules;
    }

    private boolean isScheduleActiveInRange(TherapeuticSchedule schedule, LocalDate startDate, LocalDate endDate) {
        LocalDate schedStart = effectiveStart(schedule);
        LocalDate schedEnd = effectiveEnd(schedule);
        return !schedStart.isAfter(endDate) && !schedEnd.isBefore(startDate);
    }

    private LocalDate effectiveStart(TherapeuticSchedule schedule) {
        return schedule.getStartDate() != null ? schedule.getStartDate() : LocalDate.MIN;
    }

    private LocalDate effectiveEnd(TherapeuticSchedule schedule) {
        return schedule.getEndDate() != null ? schedule.getEndDate() : LocalDate.MAX;
    }

    private boolean isScheduledOnDate(TherapeuticSchedule schedule, LocalDate date) {
        if ("DAILY".equalsIgnoreCase(schedule.getScheduleType())) {
            return true;
        }

        if ("WEEKLY".equalsIgnoreCase(schedule.getScheduleType()) && schedule.getDaysOfWeek() != null) {
            int dayOfWeek = date.getDayOfWeek().getValue();
            return schedule.getDaysOfWeek().contains(dayOfWeek);
        }

        if ("INTERVAL".equalsIgnoreCase(schedule.getScheduleType())
                && schedule.getIntervalDays() != null
                && schedule.getStartDate() != null) {
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(schedule.getStartDate(), date);
            return daysBetween >= 0 && daysBetween % schedule.getIntervalDays() == 0;
        }

        return false;
    }

    private void applyRequest(TherapeuticSchedule schedule, ScheduleRequest request) {
        schedule.setTherapeuticType(request.getTherapeuticType());
        schedule.setTherapeuticId(request.getTherapeuticId());
        schedule.setScheduleType(request.getScheduleType());
        schedule.setDaysOfWeek(request.getDaysOfWeek());
        schedule.setIntervalDays(request.getIntervalDays());
        schedule.setTimeOfDay(request.getTimeOfDay());
        schedule.setDosageOverride(request.getDosageOverride());
        schedule.setDosageUnit(request.getDosageUnit());
        schedule.setNotes(request.getNotes());
        schedule.setStartDate(request.getStartDate());
        schedule.setEndDate(request.getEndDate());
    }

    private TherapeuticSchedule findByIdForCurrentUser(Long id) {
        Long userId = userService.getCurrentUserId();
        return scheduleRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("TherapeuticSchedule", id));
    }
}
