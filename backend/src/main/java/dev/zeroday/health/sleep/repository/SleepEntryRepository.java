package dev.zeroday.health.sleep.repository;

import dev.zeroday.health.sleep.model.SleepEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SleepEntryRepository extends JpaRepository<SleepEntry, Long> {

    @Query("SELECT DISTINCT e FROM SleepEntry e LEFT JOIN FETCH e.interruptions WHERE e.userId = :userId AND e.date = :date")
    Optional<SleepEntry> findByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    Page<SleepEntry> findByUserIdOrderByDateDesc(Long userId, Pageable pageable);

    @Query("SELECT DISTINCT e FROM SleepEntry e LEFT JOIN FETCH e.interruptions WHERE e.userId = :userId AND e.date BETWEEN :from AND :to ORDER BY e.date")
    List<SleepEntry> findByUserIdAndDateBetween(@Param("userId") Long userId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
