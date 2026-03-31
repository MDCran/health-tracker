package dev.zeroday.health.workout.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.user.UserService;
import dev.zeroday.health.workout.dto.*;
import dev.zeroday.health.workout.model.*;
import dev.zeroday.health.workout.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutSessionRepository sessionRepository;
    private final WorkoutExerciseRepository exerciseRepository;
    private final ExerciseSetRepository setRepository;
    private final ExerciseRepository exerciseCatalogRepository;
    private final WorkoutTemplateRepository templateRepository;
    private final PersonalRecordService personalRecordService;
    private final UserService userService;
    private final EntityManager em;

    @Transactional(readOnly = true)
    public Page<WorkoutSessionResponse> listSessions(Pageable pageable) {
        Long userId = userService.getCurrentUserId();
        return sessionRepository.findByUserIdOrderByDateDesc(userId, pageable)
                .map(session -> {
                    try {
                        session.getExercises().forEach(ex -> {
                            ex.getExercise().getName();
                            ex.getSets().size();
                        });
                        return WorkoutSessionResponse.from(session);
                    } catch (Exception e) {
                        return WorkoutSessionResponse.fromSummary(session);
                    }
                });
    }

    @Transactional
    public WorkoutSessionResponse createSession(WorkoutSessionRequest request) {
        Long userId = userService.getCurrentUserId();

        WorkoutSession session = new WorkoutSession();
        session.setUserId(userId);
        session.setName(request.getName());
        session.setDate(request.getDate());
        session.setNotes(request.getNotes());

        if (request.getTemplateId() != null) {
            WorkoutTemplate template = templateRepository.findById(request.getTemplateId())
                    .orElseThrow(() -> new ResourceNotFoundException("WorkoutTemplate", request.getTemplateId()));
            session.setTemplate(template);
        }

        session = sessionRepository.save(session);
        return WorkoutSessionResponse.from(session);
    }

    @Transactional(readOnly = true)
    public WorkoutSessionResponse getSessionWithDetails(Long sessionId) {
        WorkoutSession session = getSessionForCurrentUser(sessionId);
        session.getExercises().forEach(ex -> {
            ex.getExercise().getName();
            ex.getSets().size();
        });
        return WorkoutSessionResponse.from(session);
    }

    @Transactional
    public WorkoutSessionResponse updateSession(Long sessionId, WorkoutSessionRequest request) {
        WorkoutSession session = getSessionForCurrentUser(sessionId);

        session.setName(request.getName());
        session.setDate(request.getDate());
        session.setNotes(request.getNotes());

        if (request.getTemplateId() != null) {
            WorkoutTemplate template = templateRepository.findById(request.getTemplateId())
                    .orElseThrow(() -> new ResourceNotFoundException("WorkoutTemplate", request.getTemplateId()));
            session.setTemplate(template);
        } else {
            session.setTemplate(null);
        }

        session = sessionRepository.save(session);
        return WorkoutSessionResponse.from(session);
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        WorkoutSession session = getSessionForCurrentUser(sessionId);
        em.createNativeQuery(
            "DELETE FROM personal_record WHERE exercise_set_id IN " +
            "(SELECT es.id FROM exercise_set es JOIN workout_exercise we ON es.workout_exercise_id = we.id WHERE we.session_id = ?1)"
        ).setParameter(1, sessionId).executeUpdate();
        sessionRepository.delete(session);
    }

    @Transactional
    public WorkoutSessionResponse startSession(Long sessionId) {
        WorkoutSession session = getSessionForCurrentUser(sessionId);
        session.setStartedAt(Instant.now());
        session = sessionRepository.save(session);
        return WorkoutSessionResponse.from(session);
    }

    @Transactional
    public WorkoutSessionResponse finishSession(Long sessionId) {
        WorkoutSession session = getSessionForCurrentUser(sessionId);
        Instant now = Instant.now();
        session.setFinishedAt(now);

        if (session.getStartedAt() != null) {
            long seconds = now.getEpochSecond() - session.getStartedAt().getEpochSecond();
            session.setDurationSeconds((int) seconds);
        }

        session = sessionRepository.save(session);
        return WorkoutSessionResponse.from(session);
    }

    @Transactional
    public WorkoutExerciseResponse addExercise(Long sessionId, WorkoutExerciseRequest request) {
        WorkoutSession session = getSessionForCurrentUser(sessionId);

        Exercise exercise = exerciseCatalogRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new ResourceNotFoundException("Exercise", request.getExerciseId()));

        WorkoutExercise we = new WorkoutExercise();
        we.setSession(session);
        we.setExercise(exercise);
        we.setExerciseOrder(request.getExerciseOrder());
        we.setNotes(request.getNotes());
        we.setRestSeconds(request.getRestSeconds());

        we = exerciseRepository.save(we);
        return WorkoutExerciseResponse.from(we);
    }

    @Transactional
    public WorkoutExerciseResponse updateExercise(Long sessionId, Long exerciseId, WorkoutExerciseRequest request) {
        getSessionForCurrentUser(sessionId);

        WorkoutExercise we = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutExercise", exerciseId));

        if (request.getExerciseId() != null) {
            Exercise exercise = exerciseCatalogRepository.findById(request.getExerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise", request.getExerciseId()));
            we.setExercise(exercise);
        }

        we.setExerciseOrder(request.getExerciseOrder());
        we.setNotes(request.getNotes());
        we.setRestSeconds(request.getRestSeconds());

        we = exerciseRepository.save(we);
        return WorkoutExerciseResponse.from(we);
    }

    @Transactional
    public void deleteExercise(Long sessionId, Long exerciseId) {
        getSessionForCurrentUser(sessionId);

        WorkoutExercise we = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutExercise", exerciseId));

        exerciseRepository.delete(we);
    }

    @Transactional
    public ExerciseSetResponse addSet(Long sessionId, Long exerciseId, ExerciseSetRequest request) {
        getSessionForCurrentUser(sessionId);

        WorkoutExercise we = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutExercise", exerciseId));

        ExerciseSet set = new ExerciseSet();
        set.setWorkoutExercise(we);
        set.setSetNumber(request.getSetNumber());
        set.setSetType(request.getSetType());
        set.setReps(request.getReps());
        set.setWeightKg(request.getWeightKg());
        set.setDurationSeconds(request.getDurationSeconds());
        set.setCompleted(request.isCompleted());
        set.setRpe(request.getRpe());
        set.setNotes(request.getNotes());

        set = setRepository.save(set);

        if (set.isCompleted()) {
            Long userId = userService.getCurrentUserId();
            personalRecordService.checkAndUpdatePRs(userId, we.getExercise().getId(), set);
        }

        return ExerciseSetResponse.from(set);
    }

    @Transactional
    public ExerciseSetResponse updateSet(Long sessionId, Long exerciseId, Long setId, ExerciseSetRequest request) {
        getSessionForCurrentUser(sessionId);

        ExerciseSet set = setRepository.findById(setId)
                .orElseThrow(() -> new ResourceNotFoundException("ExerciseSet", setId));

        set.setSetNumber(request.getSetNumber());
        set.setSetType(request.getSetType());
        set.setReps(request.getReps());
        set.setWeightKg(request.getWeightKg());
        set.setDurationSeconds(request.getDurationSeconds());
        set.setCompleted(request.isCompleted());
        set.setRpe(request.getRpe());
        set.setNotes(request.getNotes());

        set = setRepository.save(set);

        if (set.isCompleted()) {
            Long userId = userService.getCurrentUserId();
            WorkoutExercise we = exerciseRepository.findById(exerciseId)
                    .orElseThrow(() -> new ResourceNotFoundException("WorkoutExercise", exerciseId));
            personalRecordService.checkAndUpdatePRs(userId, we.getExercise().getId(), set);
        }

        return ExerciseSetResponse.from(set);
    }

    @Transactional
    public void deleteSet(Long sessionId, Long exerciseId, Long setId) {
        getSessionForCurrentUser(sessionId);

        ExerciseSet set = setRepository.findById(setId)
                .orElseThrow(() -> new ResourceNotFoundException("ExerciseSet", setId));

        setRepository.delete(set);
    }

    private WorkoutSession getSessionForCurrentUser(Long sessionId) {
        Long userId = userService.getCurrentUserId();
        WorkoutSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutSession", sessionId));

        if (!session.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("WorkoutSession", sessionId);
        }

        return session;
    }
}
