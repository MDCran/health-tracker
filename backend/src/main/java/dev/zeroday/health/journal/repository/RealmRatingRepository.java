package dev.zeroday.health.journal.repository;

import dev.zeroday.health.journal.model.RealmRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RealmRatingRepository extends JpaRepository<RealmRating, Long> {

    List<RealmRating> findByJournalEntryId(Long journalEntryId);
}
