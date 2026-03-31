package dev.zeroday.health.journal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealmAverageResponse {

    private String realm;
    private double averageRating;
    private long count;
}
