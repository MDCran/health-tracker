package dev.zeroday.health.substance.repository;

import dev.zeroday.health.substance.model.CustomSubstanceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomSubstanceTypeRepository extends JpaRepository<CustomSubstanceType, Long> {

    List<CustomSubstanceType> findByUserId(Long userId);

    Optional<CustomSubstanceType> findByUserIdAndKey(Long userId, String key);
}
