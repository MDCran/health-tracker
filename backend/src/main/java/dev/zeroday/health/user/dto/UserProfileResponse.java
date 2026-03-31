package dev.zeroday.health.user.dto;

import dev.zeroday.health.user.UserProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;

@Getter
@Builder
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private BigDecimal heightCm;
    private BigDecimal weightKg;
    private String unitSystem;
    private String gender;
    private String activityLevel;
    private String dietGoal;
    private BigDecimal targetWeeklyChangeKg;
    private boolean hasAvatar;
    private boolean googleConnected;
    private String sidebarConfig;
    private boolean hasOpenaiKey;
    private String openaiApiKeyMasked;
    private Integer age;
    private BigDecimal bmr;
    private BigDecimal tdee;
    private NutritionTargets recommendedTargets;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class NutritionTargets {
        private int calories;
        private int proteinG;
        private int carbsG;
        private int fatG;
        private int fiberG;
    }

    public static UserProfileResponse from(UserProfile profile, String username) {
        Integer age = null;
        BigDecimal bmr = null;
        BigDecimal tdee = null;
        NutritionTargets targets = null;

        if (profile.getDateOfBirth() != null) {
            age = Period.between(profile.getDateOfBirth(), LocalDate.now()).getYears();
        }

        if (profile.getWeightKg() != null && profile.getHeightCm() != null && age != null && profile.getGender() != null) {
            double w = profile.getWeightKg().doubleValue();
            double h = profile.getHeightCm().doubleValue();
            double a = age;

            double bmrVal = 10 * w + 6.25 * h - 5 * a;
            bmrVal += "MALE".equalsIgnoreCase(profile.getGender()) ? 5 : -161;
            bmr = BigDecimal.valueOf(bmrVal).setScale(0, RoundingMode.HALF_UP);

            double multiplier = switch (profile.getActivityLevel() != null ? profile.getActivityLevel() : "MODERATE") {
                case "SEDENTARY" -> 1.2;
                case "LIGHT" -> 1.375;
                case "MODERATE" -> 1.55;
                case "ACTIVE" -> 1.725;
                case "VERY_ACTIVE" -> 1.9;
                default -> 1.55;
            };
            double tdeeVal = bmrVal * multiplier;
            tdee = BigDecimal.valueOf(tdeeVal).setScale(0, RoundingMode.HALF_UP);

            String goal = profile.getDietGoal() != null ? profile.getDietGoal() : "MAINTAIN";
            double weeklyChangeKg = profile.getTargetWeeklyChangeKg() != null
                    ? profile.getTargetWeeklyChangeKg().doubleValue() : 0;

            double dailyCalAdjustment;
            if (Math.abs(weeklyChangeKg) > 0.01) {
                dailyCalAdjustment = weeklyChangeKg * 7700.0 / 7.0;
            } else {
                dailyCalAdjustment = switch (goal) {
                    case "CUT" -> tdeeVal * -0.20;
                    case "BULK" -> tdeeVal * 0.15;
                    default -> 0;
                };
            }
            double targetCals = tdeeVal + dailyCalAdjustment;
            targetCals = Math.max(1200, targetCals);

            double protPct, carbPct, fatPct;
            switch (goal) {
                case "CUT" -> { protPct = 0.40; carbPct = 0.30; fatPct = 0.30; }
                case "BULK" -> { protPct = 0.30; carbPct = 0.45; fatPct = 0.25; }
                default -> { protPct = 0.30; carbPct = 0.40; fatPct = 0.30; }
            }

            targets = NutritionTargets.builder()
                    .calories((int) targetCals)
                    .proteinG((int) (targetCals * protPct / 4))
                    .carbsG((int) (targetCals * carbPct / 4))
                    .fatG((int) (targetCals * fatPct / 9))
                    .fiberG(28)
                    .build();
        }

        return UserProfileResponse.builder()
                .id(profile.getId())
                .username(username)
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .dateOfBirth(profile.getDateOfBirth())
                .heightCm(profile.getHeightCm())
                .weightKg(profile.getWeightKg())
                .unitSystem(profile.getUnitSystem())
                .gender(profile.getGender())
                .activityLevel(profile.getActivityLevel())
                .dietGoal(profile.getDietGoal())
                .targetWeeklyChangeKg(profile.getTargetWeeklyChangeKg())
                .hasAvatar(profile.getAvatarPath() != null)
                .googleConnected(profile.isGoogleConnected())
                .hasOpenaiKey(profile.getOpenaiApiKey() != null && !profile.getOpenaiApiKey().isBlank())
                .openaiApiKeyMasked(maskKey(profile.getOpenaiApiKey()))
                .sidebarConfig(profile.getSidebarConfig())
                .age(age)
                .bmr(bmr)
                .tdee(tdee)
                .recommendedTargets(targets)
                .build();
    }

    private static String maskKey(String key) {
        if (key == null || key.isBlank()) return null;
        if (key.length() <= 12) return "****";
        return key.substring(0, 8) + "..." + key.substring(key.length() - 4);
    }
}
