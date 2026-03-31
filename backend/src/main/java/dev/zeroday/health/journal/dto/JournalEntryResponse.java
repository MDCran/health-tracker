package dev.zeroday.health.journal.dto;

import dev.zeroday.health.journal.model.JournalEntry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryResponse {

    private Long id;
    private LocalDate date;
    private String reflection;
    private String gratitude;
    private Integer overallRating;
    private List<RealmRatingResponse> realmRatings;
    private Instant createdAt;
    private Instant updatedAt;

    public static JournalEntryResponse from(JournalEntry entry) {
        List<RealmRatingResponse> ratings = entry.getRealmRatings() != null
                ? entry.getRealmRatings().stream().map(RealmRatingResponse::from).toList()
                : List.of();

        return JournalEntryResponse.builder()
                .id(entry.getId())
                .date(entry.getDate())
                .reflection(entry.getReflection())
                .gratitude(entry.getGratitude())
                .overallRating(entry.getOverallRating())
                .realmRatings(ratings)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
