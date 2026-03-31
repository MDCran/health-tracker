package dev.zeroday.health.therapeutics.repository;

import dev.zeroday.health.therapeutics.model.TherapeuticSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TherapeuticScheduleRepository extends JpaRepository<TherapeuticSchedule, Long> {

    List<TherapeuticSchedule> findByUserIdAndActiveTrue(Long userId);

    List<TherapeuticSchedule> findByTherapeuticTypeAndTherapeuticId(String therapeuticType, Long therapeuticId);

    @Query(value = "SELECT * FROM therapeutic_schedule WHERE user_id = :userId AND active = true " +
            "AND :dayOfWeek = ANY(days_of_week)", nativeQuery = true)
    List<TherapeuticSchedule> findByUserIdAndActiveTrueAndDaysOfWeekContaining(
            @Param("userId") Long userId,
            @Param("dayOfWeek") Integer dayOfWeek);

    Optional<TherapeuticSchedule> findByIdAndUserId(Long id, Long userId);

    List<TherapeuticSchedule> findByUserIdAndActiveTrueAndTherapeuticType(Long userId, String therapeuticType);
}
