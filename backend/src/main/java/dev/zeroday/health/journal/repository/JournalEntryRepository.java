package dev.zeroday.health.journal.repository;

import dev.zeroday.health.journal.model.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Optional<JournalEntry> findByUserIdAndDate(Long userId, LocalDate date);

    Page<JournalEntry> findByUserIdOrderByDateDesc(Long userId, Pageable pageable);

    List<JournalEntry> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
}
