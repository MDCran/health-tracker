package dev.zeroday.health.medical.repository;

import dev.zeroday.health.medical.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByUserIdOrderByRecordDateDesc(Long userId);
}
