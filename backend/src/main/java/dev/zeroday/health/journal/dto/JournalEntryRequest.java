package dev.zeroday.health.journal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class JournalEntryRequest {

    @NotNull(message = "Date is required")
    private LocalDate date;

    private String reflection;

    private String gratitude;

    private Integer overallRating;

    private List<RealmRatingRequest> realmRatings;

    @Data
    public static class RealmRatingRequest {
        private String realm;
        private Integer rating;
        private Map<String, Object> likertResponses;
        private String notes;
    }
}
