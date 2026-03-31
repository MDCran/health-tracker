package dev.zeroday.health.user;

import dev.zeroday.health.common.BaseEntity;
import dev.zeroday.health.common.util.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor
public class UserProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "height_cm", precision = 5, scale = 1)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", precision = 5, scale = 1)
    private BigDecimal weightKg;

    @Column(name = "unit_system", nullable = false, length = 10)
    private String unitSystem = "IMPERIAL";

    @Column(length = 10)
    private String gender;

    @Column(name = "activity_level", length = 20)
    private String activityLevel = "MODERATE";

    @Column(name = "diet_goal", length = 20)
    private String dietGoal = "MAINTAIN";

    @Column(name = "target_weekly_change_kg", precision = 4, scale = 2)
    private BigDecimal targetWeeklyChangeKg = BigDecimal.ZERO;

    @Column(name = "avatar_path", length = 500)
    private String avatarPath;

    @Column(name = "openai_api_key", length = 500)
    private String openaiApiKey;

    @Column(name = "google_access_token", columnDefinition = "text")
    private String googleAccessToken;

    @Column(name = "google_refresh_token", columnDefinition = "text")
    private String googleRefreshToken;

    @Column(name = "google_token_expiry")
    private Instant googleTokenExpiry;

    @Column(name = "google_drive_folder_id", length = 100)
    private String googleDriveFolderId;

    @Column(name = "google_connected", nullable = false)
    private boolean googleConnected = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sidebar_config", columnDefinition = "jsonb")
    private String sidebarConfig;
}
