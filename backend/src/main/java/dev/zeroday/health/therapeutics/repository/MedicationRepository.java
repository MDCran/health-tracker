package dev.zeroday.health.therapeutics.repository;

import dev.zeroday.health.therapeutics.model.Medication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicationRepository extends JpaRepository<Medication, Long> {

    List<Medication> findByUserIdAndActiveTrue(Long userId);

    List<Medication> findByUserId(Long userId);

    Optional<Medication> findByIdAndUserId(Long id, Long userId);
}
