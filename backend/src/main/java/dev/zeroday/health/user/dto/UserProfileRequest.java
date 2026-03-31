package dev.zeroday.health.user.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class UserProfileRequest {
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private BigDecimal heightCm;
    private BigDecimal weightKg;
    private String unitSystem;
    private String gender;
    private String activityLevel;
    private String dietGoal;
    private java.math.BigDecimal targetWeeklyChangeKg;
    private String openaiApiKey;
}
