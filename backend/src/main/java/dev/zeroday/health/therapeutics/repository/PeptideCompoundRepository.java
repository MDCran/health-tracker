package dev.zeroday.health.therapeutics.repository;

import dev.zeroday.health.therapeutics.model.PeptideCompound;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PeptideCompoundRepository extends JpaRepository<PeptideCompound, Long> {

    List<PeptideCompound> findByPeptideId(Long peptideId);
}
