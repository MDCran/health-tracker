package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.PersonalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PersonalRecordRepository extends JpaRepository<PersonalRecord, Long> {

    List<PersonalRecord> findByUserIdAndExerciseId(Long userId, Long exerciseId);

    Optional<PersonalRecord> findByUserIdAndExerciseIdAndRecordType(Long userId, Long exerciseId, String recordType);

    Page<PersonalRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
