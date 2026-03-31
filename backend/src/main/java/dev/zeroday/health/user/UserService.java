package dev.zeroday.health.user;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.user.dto.UserProfileRequest;
import dev.zeroday.health.user.dto.UserProfileResponse;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final EntityManager em;

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentProfile() {
        User user = getCurrentUser();
        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile", user.getId()));
        return UserProfileResponse.from(profile, user.getUsername());
    }

    @Transactional
    public UserProfileResponse updateProfile(UserProfileRequest request) {
        User user = getCurrentUser();
        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile", user.getId()));

        if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) profile.setLastName(request.getLastName());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getHeightCm() != null) profile.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) profile.setWeightKg(request.getWeightKg());
        if (request.getUnitSystem() != null) profile.setUnitSystem(request.getUnitSystem());
        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getActivityLevel() != null) profile.setActivityLevel(request.getActivityLevel());
        if (request.getDietGoal() != null) profile.setDietGoal(request.getDietGoal());
        if (request.getTargetWeeklyChangeKg() != null) profile.setTargetWeeklyChangeKg(request.getTargetWeeklyChangeKg());
        if (request.getOpenaiApiKey() != null) profile.setOpenaiApiKey(request.getOpenaiApiKey());

        profile = profileRepository.save(profile);
        return UserProfileResponse.from(profile, user.getUsername());
    }

    @Transactional
    public void deleteCurrentAccount() {
        User user = getCurrentUser();
        Long userId = user.getId();

        String[] tables = {
            "DELETE FROM personal_record WHERE user_id = ?1",
            "DELETE FROM exercise_set WHERE workout_exercise_id IN (SELECT id FROM workout_exercise WHERE session_id IN (SELECT id FROM workout_session WHERE user_id = ?1))",
            "DELETE FROM workout_exercise WHERE session_id IN (SELECT id FROM workout_session WHERE user_id = ?1)",
            "DELETE FROM workout_session WHERE user_id = ?1",
            "DELETE FROM workout_schedule WHERE user_id = ?1",
            "DELETE FROM workout_template_exercise WHERE template_id IN (SELECT id FROM workout_template WHERE user_id = ?1)",
            "DELETE FROM workout_template WHERE user_id = ?1",
            "DELETE FROM food_entry WHERE meal_id IN (SELECT id FROM meal WHERE nutrition_day_id IN (SELECT id FROM nutrition_day WHERE user_id = ?1))",
            "DELETE FROM meal WHERE nutrition_day_id IN (SELECT id FROM nutrition_day WHERE user_id = ?1)",
            "DELETE FROM nutrition_day WHERE user_id = ?1",
            "DELETE FROM nutrition_goal WHERE user_id = ?1",
            "DELETE FROM habit_log WHERE habit_id IN (SELECT id FROM habit WHERE user_id = ?1)",
            "DELETE FROM habit_milestone WHERE habit_id IN (SELECT id FROM habit WHERE user_id = ?1)",
            "DELETE FROM habit WHERE user_id = ?1",
            "DELETE FROM body_metric WHERE user_id = ?1",
            "DELETE FROM vital_reading WHERE user_id = ?1",
            "DELETE FROM sleep_interruption WHERE sleep_entry_id IN (SELECT id FROM sleep_entry WHERE user_id = ?1)",
            "DELETE FROM sleep_entry WHERE user_id = ?1",
            "DELETE FROM substance_log WHERE user_id = ?1",
            "DELETE FROM custom_substance_type WHERE user_id = ?1",
            "DELETE FROM appointment WHERE user_id = ?1",
            "DELETE FROM medical_record WHERE user_id = ?1",
            "DELETE FROM progress_photo WHERE user_id = ?1",
            "DELETE FROM notification WHERE user_id = ?1",
            "DELETE FROM therapeutic_log WHERE user_id = ?1",
            "DELETE FROM therapeutic_schedule WHERE user_id = ?1",
            "DELETE FROM peptide_compound WHERE peptide_id IN (SELECT id FROM peptide WHERE user_id = ?1)",
            "DELETE FROM peptide WHERE user_id = ?1",
            "DELETE FROM medication WHERE user_id = ?1",
            "DELETE FROM supplement WHERE user_id = ?1",
            "DELETE FROM realm_rating WHERE journal_entry_id IN (SELECT id FROM journal_entry WHERE user_id = ?1)",
            "DELETE FROM journal_entry WHERE user_id = ?1",
        };

        for (String sql : tables) {
            try {
                em.createNativeQuery(sql).setParameter(1, userId).executeUpdate();
            } catch (Exception e) {
            }
        }

        em.createNativeQuery("DELETE FROM user_profile WHERE user_id = ?1").setParameter(1, userId).executeUpdate();
        em.createNativeQuery("DELETE FROM app_user WHERE id = ?1").setParameter(1, userId).executeUpdate();
    }
}
