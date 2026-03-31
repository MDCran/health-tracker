package dev.zeroday.health.photos.dto;

import dev.zeroday.health.photos.model.ProgressPhoto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class ProgressPhotoResponse {
    private Long id;
    private Long workoutSessionId;
    private String fileName;
    private String imageUrl;
    private Instant takenAt;
    private BigDecimal weightKg;
    private String notes;
    private String metricsSnapshot;
    private Instant createdAt;

    public static ProgressPhotoResponse from(ProgressPhoto photo, String baseUrl) {
        return ProgressPhotoResponse.builder()
                .id(photo.getId())
                .workoutSessionId(photo.getWorkoutSessionId())
                .fileName(photo.getFileName())
                .imageUrl(baseUrl + "/api/v1/photos/" + photo.getId() + "/image")
                .takenAt(photo.getTakenAt())
                .weightKg(photo.getWeightKg())
                .notes(photo.getNotes())
                .metricsSnapshot(photo.getMetricsSnapshot())
                .createdAt(photo.getCreatedAt())
                .build();
    }
}
