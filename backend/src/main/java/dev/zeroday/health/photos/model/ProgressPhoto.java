package dev.zeroday.health.photos.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "progress_photo")
@Getter
@Setter
@NoArgsConstructor
public class ProgressPhoto extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "workout_session_id")
    private Long workoutSessionId;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "taken_at", nullable = false)
    private Instant takenAt;

    @Column(name = "weight_kg", precision = 5, scale = 1)
    private BigDecimal weightKg;

    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metrics_snapshot", columnDefinition = "jsonb")
    private String metricsSnapshot;

    @Column(name = "drive_file_id", length = 100)
    private String driveFileId;
}
