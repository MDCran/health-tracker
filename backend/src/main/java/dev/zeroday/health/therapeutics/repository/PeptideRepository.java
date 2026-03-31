package dev.zeroday.health.therapeutics.repository;

import dev.zeroday.health.therapeutics.model.Peptide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeptideRepository extends JpaRepository<Peptide, Long> {

    List<Peptide> findByUserIdAndActiveTrue(Long userId);

    List<Peptide> findByUserId(Long userId);

    Optional<Peptide> findByIdAndUserId(Long id, Long userId);
}
