package dev.zeroday.health.therapeutics.repository;

import dev.zeroday.health.therapeutics.model.Supplement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupplementRepository extends JpaRepository<Supplement, Long> {

    List<Supplement> findByUserIdAndActiveTrue(Long userId);

    List<Supplement> findByUserId(Long userId);

    Optional<Supplement> findByIdAndUserId(Long id, Long userId);
}
