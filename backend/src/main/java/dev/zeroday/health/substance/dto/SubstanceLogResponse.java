package dev.zeroday.health.substance.dto;

import dev.zeroday.health.substance.model.SubstanceLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubstanceLogResponse {

    private Long id;
    private String substanceType;
    private Instant occurredAt;
    private String amount;
    private String notes;
    private String context;
    private Integer moodBefore;
    private Integer moodAfter;
    private Instant createdAt;
    private Instant updatedAt;

    public static SubstanceLogResponse from(SubstanceLog log) {
        return SubstanceLogResponse.builder()
                .id(log.getId())
                .substanceType(log.getSubstanceType())
                .occurredAt(log.getOccurredAt())
                .amount(log.getAmount())
                .notes(log.getNotes())
                .context(log.getContext())
                .moodBefore(log.getMoodBefore())
                .moodAfter(log.getMoodAfter())
                .createdAt(log.getCreatedAt())
                .updatedAt(log.getUpdatedAt())
                .build();
    }
}
