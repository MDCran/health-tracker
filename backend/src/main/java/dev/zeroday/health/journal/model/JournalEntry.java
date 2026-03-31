package dev.zeroday.health.journal.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_entry")
@Getter
@Setter
@NoArgsConstructor
public class JournalEntry extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "text")
    private String reflection;

    @Column(columnDefinition = "text")
    private String gratitude;

    @Column(name = "overall_rating")
    private Integer overallRating;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RealmRating> realmRatings = new ArrayList<>();
}
