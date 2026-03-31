package dev.zeroday.health.sleep.repository;

import dev.zeroday.health.sleep.model.SleepInterruption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SleepInterruptionRepository extends JpaRepository<SleepInterruption, Long> {

    List<SleepInterruption> findBySleepEntryId(Long sleepEntryId);
}
