package dev.zeroday.health.journal.dto;

import dev.zeroday.health.journal.model.RealmRating;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealmRatingResponse {

    private Long id;
    private String realm;
    private Integer rating;
    private String likertResponses;
    private String notes;

    public static RealmRatingResponse from(RealmRating rating) {
        return RealmRatingResponse.builder()
                .id(rating.getId())
                .realm(rating.getRealm())
                .rating(rating.getRating())
                .likertResponses(rating.getLikertResponses())
                .notes(rating.getNotes())
                .build();
    }
}
