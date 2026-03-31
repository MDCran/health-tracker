package dev.zeroday.health.workout.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "exercise")
@Getter
@Setter
@NoArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", length = 100)
    private String externalId;

    @Column(nullable = false)
    private String name;

    @Column(name = "force_type", length = 50)
    private String forceType;

    @Column(length = 50)
    private String level;

    @Column(length = 50)
    private String mechanic;

    @Column(length = 100)
    private String equipment;

    @Column(length = 50)
    private String category;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "primary_muscles", columnDefinition = "varchar(50)[]")
    private List<String> primaryMuscles;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "secondary_muscles", columnDefinition = "varchar(50)[]")
    private List<String> secondaryMuscles;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "instructions", columnDefinition = "varchar[]")
    private List<String> instructions;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "image_paths", columnDefinition = "varchar[]")
    private List<String> imagePaths;

    @Column(name = "body_part", length = 50)
    private String bodyPart;

    @Column(name = "target_muscle", length = 50)
    private String targetMuscle;

    @Column(name = "gif_url", length = 500)
    private String gifUrl;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "video_urls", columnDefinition = "text[]")
    private List<String> videoUrls;

    @Column(columnDefinition = "text")
    private String description;

    @Column(length = 20)
    private String difficulty;

    @Column(length = 20)
    private String source;

    @Column(name = "source_id", length = 100)
    private String sourceId;

    @Column(name = "is_custom", nullable = false)
    private boolean isCustom;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
