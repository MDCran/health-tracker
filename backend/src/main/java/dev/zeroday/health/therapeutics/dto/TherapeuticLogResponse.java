package dev.zeroday.health.therapeutics.dto;

import dev.zeroday.health.therapeutics.model.TherapeuticLog;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@AllArgsConstructor
public class TherapeuticLogResponse {

    private Long id;
    private String therapeuticType;
    private Long therapeuticId;
    private Long scheduleId;
    private Instant takenAt;
    private BigDecimal dosageAmount;
    private String dosageUnit;
    private String notes;
    private boolean skipped;
    private Instant createdAt;

    public static TherapeuticLogResponse from(TherapeuticLog log) {
        return new TherapeuticLogResponse(
                log.getId(),
                log.getTherapeuticType(),
                log.getTherapeuticId(),
                log.getScheduleId(),
                log.getTakenAt(),
                log.getDosageAmount(),
                log.getDosageUnit(),
                log.getNotes(),
                log.isSkipped(),
                log.getCreatedAt()
        );
    }
}
