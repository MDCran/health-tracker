package dev.zeroday.health.workout.service;

import dev.zeroday.health.user.UserService;
import dev.zeroday.health.workout.dto.ExerciseSetResponse;
import dev.zeroday.health.workout.dto.PersonalRecordResponse;
import dev.zeroday.health.workout.model.ExerciseSet;
import dev.zeroday.health.workout.model.PersonalRecord;
import dev.zeroday.health.workout.model.RecordType;
import dev.zeroday.health.workout.repository.ExerciseRepository;
import dev.zeroday.health.workout.repository.ExerciseSetRepository;
import dev.zeroday.health.workout.repository.PersonalRecordRepository;
import dev.zeroday.health.workout.repository.WorkoutExerciseRepository;
import dev.zeroday.health.workout.repository.WorkoutSessionRepository;
import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.workout.model.WorkoutExercise;
import dev.zeroday.health.workout.model.WorkoutSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PersonalRecordService {

    private final PersonalRecordRepository recordRepository;
    private final ExerciseRepository exerciseRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;
    private final ExerciseSetRepository exerciseSetRepository;
    private final UserService userService;

    @Transactional
    public void checkAndUpdatePRs(Long userId, Long exerciseId, ExerciseSet set) {
        LocalDate today = LocalDate.now();
        Long weId = set.getWorkoutExercise().getId();
        Long setId = set.getId();
        BigDecimal weight = set.getWeightKg();
        Integer reps = set.getReps();
        Integer setNum = set.getSetNumber();

        if (weight == null || reps == null || reps < 1) return;

        Optional<PersonalRecord> existingWeight = recordRepository
                .findByUserIdAndExerciseIdAndRecordType(userId, exerciseId, RecordType.MAX_WEIGHT.name());

        boolean isWeightPR = false;
        if (existingWeight.isPresent()) {
            PersonalRecord pr = existingWeight.get();
            if (weight.compareTo(pr.getValue()) > 0) {
                isWeightPR = true;
            } else if (weight.compareTo(pr.getValue()) == 0 && reps > (pr.getReps() != null ? pr.getReps() : 0)) {
                isWeightPR = true;
            }
            if (isWeightPR) {
                pr.setValue(weight);
                pr.setUnit("kg");
                pr.setWeightKg(weight);
                pr.setReps(reps);
                pr.setSetNumber(setNum);
                pr.setAchievedAt(today);
                pr.setWorkoutExerciseId(weId);
                pr.setExerciseSetId(setId);
                recordRepository.save(pr);
            }
        } else {
            PersonalRecord pr = new PersonalRecord();
            pr.setUserId(userId);
            pr.setExercise(exerciseRepository.findById(exerciseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise", exerciseId)));
            pr.setRecordType(RecordType.MAX_WEIGHT.name());
            pr.setValue(weight);
            pr.setUnit("kg");
            pr.setWeightKg(weight);
            pr.setReps(reps);
            pr.setSetNumber(setNum);
            pr.setAchievedAt(today);
            pr.setWorkoutExerciseId(weId);
            pr.setExerciseSetId(setId);
            recordRepository.save(pr);
        }

        checkAndSavePR(userId, exerciseId, RecordType.MAX_REPS.name(),
                BigDecimal.valueOf(reps), "reps", today, weId, setId, weight, reps, setNum);
    }

    public List<PersonalRecordResponse> getRecordsForExercise(Long exerciseId) {
        Long userId = userService.getCurrentUserId();
        return recordRepository.findByUserIdAndExerciseId(userId, exerciseId).stream()
                .map(PersonalRecordResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PersonalRecordResponse> getAllRecords() {
        Long userId = userService.getCurrentUserId();
        return recordRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 500))
                .getContent().stream()
                .map(PersonalRecordResponse::from)
                .toList();
    }

    public List<PersonalRecordResponse> getRecentRecords() {
        Long userId = userService.getCurrentUserId();
        Instant thirtyDaysAgo = LocalDate.now().minusDays(30).atStartOfDay().toInstant(ZoneOffset.UTC);

        return recordRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 50))
                .getContent().stream()
                .filter(r -> r.getCreatedAt().isAfter(thirtyDaysAgo))
                .map(PersonalRecordResponse::from)
                .toList();
    }

    public Map<String, Object> getRecommendation(Long userId, Long exerciseId) {
        List<WorkoutSession> sessions = sessionRepository.findByUserIdOrderByDateDesc(userId, PageRequest.of(0, 10))
                .getContent();

        for (WorkoutSession session : sessions) {
            List<WorkoutExercise> exercises = workoutExerciseRepository.findBySessionId(session.getId());
            for (WorkoutExercise we : exercises) {
                if (we.getExercise().getId().equals(exerciseId)) {
                    List<ExerciseSet> sets = exerciseSetRepository.findByWorkoutExerciseId(we.getId());
                    if (!sets.isEmpty()) {
                        ExerciseSet lastWorkingSet = sets.stream()
                                .filter(ExerciseSet::isCompleted)
                                .reduce((first, second) -> second)
                                .orElse(sets.getLast());

                        return Map.of(
                                "lastWeight", lastWorkingSet.getWeightKg() != null ? lastWorkingSet.getWeightKg() : BigDecimal.ZERO,
                                "lastReps", lastWorkingSet.getReps() != null ? lastWorkingSet.getReps() : 0,
                                "sessionDate", session.getDate()
                        );
                    }
                }
            }
        }

        return Map.of(
                "lastWeight", BigDecimal.ZERO,
                "lastReps", 0,
                "sessionDate", LocalDate.now()
        );
    }

    private void checkAndSavePR(Long userId, Long exerciseId, String recordType,
                                BigDecimal value, String unit, LocalDate achievedAt,
                                Long weId, Long setId, BigDecimal weightKg, Integer reps, Integer setNum) {
        Optional<PersonalRecord> existing = recordRepository
                .findByUserIdAndExerciseIdAndRecordType(userId, exerciseId, recordType);

        if (existing.isPresent()) {
            PersonalRecord record = existing.get();
            if (value.compareTo(record.getValue()) > 0) {
                record.setValue(value);
                record.setUnit(unit);
                record.setWeightKg(weightKg);
                record.setReps(reps);
                record.setSetNumber(setNum);
                record.setAchievedAt(achievedAt);
                record.setWorkoutExerciseId(weId);
                record.setExerciseSetId(setId);
                recordRepository.save(record);
            }
        } else {
            PersonalRecord record = new PersonalRecord();
            record.setUserId(userId);
            record.setExercise(exerciseRepository.findById(exerciseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise", exerciseId)));
            record.setRecordType(recordType);
            record.setValue(value);
            record.setUnit(unit);
            record.setWeightKg(weightKg);
            record.setReps(reps);
            record.setSetNumber(setNum);
            record.setAchievedAt(achievedAt);
            record.setWorkoutExerciseId(weId);
            record.setExerciseSetId(setId);
            recordRepository.save(record);
        }
    }
}
