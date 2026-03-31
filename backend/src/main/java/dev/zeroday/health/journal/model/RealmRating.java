package dev.zeroday.health.journal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "realm_rating")
@Getter
@Setter
@NoArgsConstructor
public class RealmRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    @Column(nullable = false, length = 50)
    private String realm;

    @Column(nullable = false)
    private Integer rating;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "likert_responses", columnDefinition = "jsonb")
    private String likertResponses;

    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
