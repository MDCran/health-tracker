package dev.zeroday.health.workout.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.user.UserService;
import dev.zeroday.health.workout.dto.WorkoutScheduleRequest;
import dev.zeroday.health.workout.dto.WorkoutScheduleResponse;
import dev.zeroday.health.workout.dto.WorkoutTemplateRequest;
import dev.zeroday.health.workout.dto.WorkoutTemplateResponse;
import dev.zeroday.health.workout.model.Exercise;
import dev.zeroday.health.workout.model.WorkoutSchedule;
import dev.zeroday.health.workout.model.WorkoutTemplate;
import dev.zeroday.health.workout.model.WorkoutTemplateExercise;
import dev.zeroday.health.workout.repository.ExerciseRepository;
import dev.zeroday.health.workout.repository.WorkoutScheduleRepository;
import dev.zeroday.health.workout.repository.WorkoutTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkoutTemplateService {

    private final WorkoutTemplateRepository templateRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserService userService;

    public List<WorkoutTemplateResponse> listTemplates() {
        Long userId = userService.getCurrentUserId();
        return templateRepository.findByUserId(userId).stream()
                .map(WorkoutTemplateResponse::from)
                .toList();
    }

    public WorkoutTemplateResponse getTemplate(Long id) {
        WorkoutTemplate template = getTemplateForCurrentUser(id);
        return WorkoutTemplateResponse.from(template);
    }

    @Transactional
    public WorkoutTemplateResponse createTemplate(WorkoutTemplateRequest request) {
        Long userId = userService.getCurrentUserId();

        WorkoutTemplate template = new WorkoutTemplate();
        template.setUserId(userId);
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setColor(request.getColor());

        if (request.getExercises() != null) {
            request.getExercises().forEach(exReq -> {
                Exercise exercise = exerciseRepository.findById(exReq.getExerciseId())
                        .orElseThrow(() -> new ResourceNotFoundException("Exercise", exReq.getExerciseId()));

                WorkoutTemplateExercise te = new WorkoutTemplateExercise();
                te.setTemplate(template);
                te.setExercise(exercise);
                te.setExerciseOrder(exReq.getExerciseOrder());
                te.setTargetSets(exReq.getTargetSets());
                te.setTargetReps(exReq.getTargetReps());
                te.setTargetWeightKg(exReq.getTargetWeightKg());
                te.setRestSeconds(exReq.getRestSeconds());

                template.getExercises().add(te);
            });
        }

        WorkoutTemplate saved = templateRepository.save(template);
        return WorkoutTemplateResponse.from(saved);
    }

    @Transactional
    public WorkoutTemplateResponse updateTemplate(Long id, WorkoutTemplateRequest request) {
        WorkoutTemplate template = getTemplateForCurrentUser(id);

        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setColor(request.getColor());

        template.getExercises().clear();

        if (request.getExercises() != null) {
            request.getExercises().forEach(exReq -> {
                Exercise exercise = exerciseRepository.findById(exReq.getExerciseId())
                        .orElseThrow(() -> new ResourceNotFoundException("Exercise", exReq.getExerciseId()));

                WorkoutTemplateExercise te = new WorkoutTemplateExercise();
                te.setTemplate(template);
                te.setExercise(exercise);
                te.setExerciseOrder(exReq.getExerciseOrder());
                te.setTargetSets(exReq.getTargetSets());
                te.setTargetReps(exReq.getTargetReps());
                te.setTargetWeightKg(exReq.getTargetWeightKg());
                te.setRestSeconds(exReq.getRestSeconds());

                template.getExercises().add(te);
            });
        }

        WorkoutTemplate saved = templateRepository.save(template);
        return WorkoutTemplateResponse.from(saved);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        WorkoutTemplate template = getTemplateForCurrentUser(id);
        templateRepository.delete(template);
    }

    public List<WorkoutScheduleResponse> getSchedules(Long templateId) {
        getTemplateForCurrentUser(templateId);
        Long userId = userService.getCurrentUserId();
        return scheduleRepository.findByUserIdAndActiveTrue(userId).stream()
                .filter(s -> s.getTemplate().getId().equals(templateId))
                .map(WorkoutScheduleResponse::from)
                .toList();
    }

    @Transactional
    public WorkoutScheduleResponse createSchedule(Long templateId, WorkoutScheduleRequest request) {
        WorkoutTemplate template = getTemplateForCurrentUser(templateId);
        Long userId = userService.getCurrentUserId();

        WorkoutSchedule schedule = new WorkoutSchedule();
        schedule.setUserId(userId);
        schedule.setTemplate(template);
        schedule.setDaysOfWeek(request.getDaysOfWeek());
        schedule.setTimeOfDay(request.getTimeOfDay());
        schedule.setActive(request.isActive());
        schedule.setStartDate(request.getStartDate());
        schedule.setEndDate(request.getEndDate());

        schedule = scheduleRepository.save(schedule);
        return WorkoutScheduleResponse.from(schedule);
    }

    private WorkoutTemplate getTemplateForCurrentUser(Long id) {
        Long userId = userService.getCurrentUserId();
        WorkoutTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutTemplate", id));

        if (!template.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("WorkoutTemplate", id);
        }

        return template;
    }
}
