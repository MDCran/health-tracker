package dev.zeroday.health.nutrition.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.nutrition.dto.*;
import dev.zeroday.health.nutrition.model.FoodEntry;
import dev.zeroday.health.nutrition.model.Meal;
import dev.zeroday.health.nutrition.model.NutritionDay;
import dev.zeroday.health.nutrition.repository.FoodEntryRepository;
import dev.zeroday.health.nutrition.repository.MealRepository;
import dev.zeroday.health.nutrition.repository.NutritionDayRepository;
import dev.zeroday.health.integrations.GoogleDriveService;
import dev.zeroday.health.user.UserProfile;
import dev.zeroday.health.user.UserProfileRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final NutritionDayRepository nutritionDayRepository;
    private final MealRepository mealRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final ApiNinjasNutritionClient apiNinjasClient;
    private final OpenAiFoodAnalyzer foodAnalyzer;
    private final UserService userService;
    private final GoogleDriveService googleDriveService;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public NutritionDayResponse getDayWithMeals(LocalDate date) {
        Long userId = userService.getCurrentUserId();
        NutritionDay day = nutritionDayRepository.findByUserIdAndDate(userId, date)
                .orElseThrow(() -> new ResourceNotFoundException("NutritionDay", date.toString()));
        return NutritionDayResponse.from(day, calculateDayTotals(day));
    }

    @Transactional(readOnly = true)
    public List<NutritionDayResponse> getDaysBetween(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        List<NutritionDay> days = nutritionDayRepository.findByUserIdAndDateBetween(userId, from, to);
        return days.stream()
                .map(day -> NutritionDayResponse.from(day, calculateDayTotals(day)))
                .toList();
    }

    @Transactional
    public MealResponse addMeal(LocalDate date, MealRequest request) {
        Long userId = userService.getCurrentUserId();
        NutritionDay day = nutritionDayRepository.findByUserIdAndDate(userId, date)
                .orElseGet(() -> {
                    NutritionDay newDay = new NutritionDay();
                    newDay.setUserId(userId);
                    newDay.setDate(date);
                    return nutritionDayRepository.save(newDay);
                });

        int nextOrder = day.getMeals().size();

        Meal meal = new Meal();
        meal.setNutritionDay(day);
        meal.setMealType(request.getMealType());
        meal.setName(request.getName());
        meal.setMealOrder(nextOrder);
        meal.setEatenAt(request.getEatenAt());
        meal = mealRepository.save(meal);

        return MealResponse.from(meal);
    }

    @Transactional
    public MealResponse updateMeal(Long mealId, MealRequest request) {
        Meal meal = mealRepository.findById(mealId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal", mealId));

        meal.setMealType(request.getMealType());
        meal.setName(request.getName());
        if (request.getEatenAt() != null) meal.setEatenAt(request.getEatenAt());
        meal = mealRepository.save(meal);

        return MealResponse.from(meal);
    }

    @Transactional
    public void deleteMeal(Long mealId) {
        Meal meal = mealRepository.findById(mealId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal", mealId));
        mealRepository.delete(meal);
    }

    @Transactional
    public FoodEntryResponse addFoodToMeal(Long mealId, FoodEntryRequest request) {
        Meal meal = mealRepository.findById(mealId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal", mealId));

        FoodEntry entry = new FoodEntry();
        entry.setMeal(meal);

        if (request.getDescription() != null && !request.getDescription().isBlank()
                && request.getCalories() == null) {
            FoodAnalysisResponse analysis = analyzeFood(request.getDescription());

            if (!analysis.getFoods().isEmpty()) {
                FoodAnalysisResponse.AnalyzedFood analyzed = analysis.getFoods().get(0);
                entry.setDescription(analyzed.getName());
                entry.setServingSize(analyzed.getServingSize());
                entry.setCalories(analyzed.getCalories());
                entry.setProteinG(analyzed.getProteinG());
                entry.setCarbsG(analyzed.getCarbsG());
                entry.setFatG(analyzed.getFatG());
                entry.setFiberG(analyzed.getFiberG());
                entry.setSugarG(analyzed.getSugarG());
                entry.setSodiumMg(analyzed.getSodiumMg());
                entry.setCholesterolMg(analyzed.getCholesterolMg());
                entry.setSaturatedFatG(analyzed.getSaturatedFatG());
                entry.setTransFatG(analyzed.getTransFatG());
                entry.setPotassiumMg(analyzed.getPotassiumMg());
            }
            entry.setAiAnalyzed(true);
        } else {
            entry.setDescription(request.getDescription());
            entry.setServingSize(request.getServingSize());
            entry.setCalories(request.getCalories());
            entry.setProteinG(request.getProteinG());
            entry.setCarbsG(request.getCarbsG());
            entry.setFatG(request.getFatG());
            entry.setFiberG(request.getFiberG());
            entry.setSugarG(request.getSugarG());
            entry.setSodiumMg(request.getSodiumMg());
            entry.setCholesterolMg(request.getCholesterolMg());
            entry.setSaturatedFatG(request.getSaturatedFatG());
            entry.setTransFatG(request.getTransFatG());
            entry.setPotassiumMg(request.getPotassiumMg());
            entry.setAiAnalyzed(false);
        }

        entry = foodEntryRepository.save(entry);
        return FoodEntryResponse.from(entry);
    }

    @Transactional
    public FoodEntryResponse updateFood(Long foodId, FoodEntryRequest request) {
        FoodEntry entry = foodEntryRepository.findById(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("FoodEntry", foodId));

        if (request.getDescription() != null) entry.setDescription(request.getDescription());
        if (request.getServingSize() != null) entry.setServingSize(request.getServingSize());
        if (request.getCalories() != null) entry.setCalories(request.getCalories());
        if (request.getProteinG() != null) entry.setProteinG(request.getProteinG());
        if (request.getCarbsG() != null) entry.setCarbsG(request.getCarbsG());
        if (request.getFatG() != null) entry.setFatG(request.getFatG());
        if (request.getFiberG() != null) entry.setFiberG(request.getFiberG());
        if (request.getSugarG() != null) entry.setSugarG(request.getSugarG());
        if (request.getSodiumMg() != null) entry.setSodiumMg(request.getSodiumMg());
        if (request.getCholesterolMg() != null) entry.setCholesterolMg(request.getCholesterolMg());
        if (request.getSaturatedFatG() != null) entry.setSaturatedFatG(request.getSaturatedFatG());
        if (request.getTransFatG() != null) entry.setTransFatG(request.getTransFatG());
        if (request.getPotassiumMg() != null) entry.setPotassiumMg(request.getPotassiumMg());

        if (entry.isAiAnalyzed()) {
            entry.setManuallyAdjusted(true);
        }

        entry = foodEntryRepository.save(entry);
        return FoodEntryResponse.from(entry);
    }

    @Transactional
    public void deleteFood(Long foodId) {
        FoodEntry entry = foodEntryRepository.findById(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("FoodEntry", foodId));
        foodEntryRepository.delete(entry);
    }

    public FoodAnalysisResponse analyzeFoodPreview(String description) {
        return analyzeFood(description);
    }

    @Transactional
    public FoodEntryResponse uploadFoodImage(Long foodId, MultipartFile file) throws IOException {
        FoodEntry entry = foodEntryRepository.findById(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("FoodEntry", foodId));

        Long userId = userService.getCurrentUserId();
        UserProfile profile = userProfileRepository.findByUserId(userId).orElseThrow();

        if (!profile.isGoogleConnected()) {
            throw new IllegalStateException("Google Drive not connected. Connect Google Drive first.");
        }

        String ext = ".jpg";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String fileName = "food-" + foodId + "-" + UUID.randomUUID().toString().substring(0, 8) + ext;

        String driveFileId = googleDriveService.uploadBinaryFile(
                profile.getGoogleDriveFolderId(),
                "nutrition-images",
                fileName,
                file.getBytes(),
                file.getContentType() != null ? file.getContentType() : "image/jpeg"
        );
        entry.setImageDriveFileId(driveFileId);
        entry = foodEntryRepository.save(entry);
        return FoodEntryResponse.from(entry);
    }

    @Transactional(readOnly = true)
    public byte[] downloadFoodImage(Long foodId) throws IOException {
        FoodEntry entry = foodEntryRepository.findById(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("FoodEntry", foodId));
        if (entry.getImageDriveFileId() == null) {
            throw new ResourceNotFoundException("FoodEntry image", foodId);
        }
        return googleDriveService.downloadBinaryFile(entry.getImageDriveFileId());
    }

    public FoodAnalysisResponse analyzeImagePreview(byte[] imageBytes) {
        String userKey = getUserOpenAiKey();
        if (StringUtils.hasText(userKey)) {
            try {
                FoodAnalysisResponse result = foodAnalyzer.analyzeImage(imageBytes, userKey);
                if (result != null && !result.getFoods().isEmpty()) return result;
            } catch (Exception e) {  }
        }

        if (foodAnalyzer.isEnabled()) {
            try {
                FoodAnalysisResponse result = foodAnalyzer.analyzeImageWithDefaultKey(imageBytes);
                if (result != null && !result.getFoods().isEmpty()) return result;
            } catch (Exception e) {  }
        }

        return buildManualEstimation("Food from image");
    }

    private String getUserOpenAiKey() {
        try {
            Long userId = userService.getCurrentUserId();
            return userProfileRepository.findByUserId(userId)
                    .map(dev.zeroday.health.user.UserProfile::getOpenaiApiKey)
                    .filter(StringUtils::hasText)
                    .orElse(null);
        } catch (Exception e) { return null; }
    }

    private FoodAnalysisResponse analyzeFood(String description) {
        String userKey = getUserOpenAiKey();
        if (StringUtils.hasText(userKey)) {
            try {
                FoodAnalysisResponse result = foodAnalyzer.analyzeWithKey(description, userKey);
                if (result != null && !result.getFoods().isEmpty()) return result;
            } catch (Exception e) {  }
        }

        if (foodAnalyzer.isEnabled()) {
            try {
                FoodAnalysisResponse result = foodAnalyzer.analyze(description);
                if (result != null && !result.getFoods().isEmpty()) return result;
            } catch (Exception e) {  }
        }

        return buildManualEstimation(description);
    }

    private FoodAnalysisResponse buildManualEstimation(String description) {
        FoodAnalysisResponse.AnalyzedFood placeholder = FoodAnalysisResponse.AnalyzedFood.builder()
                .name(description)
                .servingSize("1 serving")
                .calories(0)
                .proteinG(java.math.BigDecimal.ZERO)
                .carbsG(java.math.BigDecimal.ZERO)
                .fatG(java.math.BigDecimal.ZERO)
                .fiberG(java.math.BigDecimal.ZERO)
                .sugarG(java.math.BigDecimal.ZERO)
                .sodiumMg(java.math.BigDecimal.ZERO)
                .cholesterolMg(java.math.BigDecimal.ZERO)
                .saturatedFatG(java.math.BigDecimal.ZERO)
                .transFatG(java.math.BigDecimal.ZERO)
                .potassiumMg(java.math.BigDecimal.ZERO)
                .build();

        return FoodAnalysisResponse.builder()
                .foods(java.util.List.of(placeholder))
                .confidence("manual")
                .notes("No AI analysis available. Please enter nutritional values manually.")
                .build();
    }


    @Transactional(readOnly = true)
    public String exportCsv(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        List<NutritionDay> days = nutritionDayRepository.findByUserIdAndDateBetween(userId, from, to);

        StringBuilder csv = new StringBuilder();
        csv.append("Date,Meal Type,Food,Serving Size,Calories,Total Fat (g),Saturated Fat (g),Trans Fat (g),Cholesterol (mg),Sodium (mg),Total Carbs (g),Dietary Fiber (g),Total Sugar (g),Protein (g),Potassium (mg)\n");

        for (NutritionDay day : days) {
            for (Meal meal : day.getMeals()) {
                for (FoodEntry entry : meal.getFoodEntries()) {
                    csv.append(String.format("%s,%s,\"%s\",\"%s\",%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                            day.getDate(),
                            meal.getMealType(),
                            escapeCsv(entry.getDescription()),
                            escapeCsv(entry.getServingSize()),
                            n(entry.getCalories()),
                            d(entry.getFatG()),
                            d(entry.getSaturatedFatG()),
                            d(entry.getTransFatG()),
                            d(entry.getCholesterolMg()),
                            d(entry.getSodiumMg()),
                            d(entry.getCarbsG()),
                            d(entry.getFiberG()),
                            d(entry.getSugarG()),
                            d(entry.getProteinG()),
                            d(entry.getPotassiumMg())));
                }
            }
        }
        return csv.toString();
    }

    private String escapeCsv(String val) {
        return val != null ? val.replace("\"", "\"\"") : "";
    }

    private String n(Integer val) { return val != null ? val.toString() : "0"; }
    private String d(BigDecimal val) { return val != null ? val.toPlainString() : "0"; }

    @Transactional(readOnly = true)
    public DailyTotals getDayTotals(LocalDate date) {
        Long userId = userService.getCurrentUserId();
        return nutritionDayRepository.findByUserIdAndDate(userId, date)
                .map(this::calculateDayTotals)
                .orElse(DailyTotals.empty());
    }

    private DailyTotals calculateDayTotals(NutritionDay day) {
        int totalCalories = 0;
        BigDecimal totalProtein = BigDecimal.ZERO;
        BigDecimal totalCarbs = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;
        BigDecimal totalFiber = BigDecimal.ZERO;
        BigDecimal totalSugar = BigDecimal.ZERO;
        BigDecimal totalSodium = BigDecimal.ZERO;
        BigDecimal totalCholesterol = BigDecimal.ZERO;
        BigDecimal totalSaturatedFat = BigDecimal.ZERO;
        BigDecimal totalTransFat = BigDecimal.ZERO;
        BigDecimal totalPotassium = BigDecimal.ZERO;

        for (Meal meal : day.getMeals()) {
            for (FoodEntry entry : meal.getFoodEntries()) {
                if (entry.getCalories() != null) totalCalories += entry.getCalories();
                totalProtein = addSafe(totalProtein, entry.getProteinG());
                totalCarbs = addSafe(totalCarbs, entry.getCarbsG());
                totalFat = addSafe(totalFat, entry.getFatG());
                totalFiber = addSafe(totalFiber, entry.getFiberG());
                totalSugar = addSafe(totalSugar, entry.getSugarG());
                totalSodium = addSafe(totalSodium, entry.getSodiumMg());
                totalCholesterol = addSafe(totalCholesterol, entry.getCholesterolMg());
                totalSaturatedFat = addSafe(totalSaturatedFat, entry.getSaturatedFatG());
                totalTransFat = addSafe(totalTransFat, entry.getTransFatG());
                totalPotassium = addSafe(totalPotassium, entry.getPotassiumMg());
            }
        }

        return DailyTotals.builder()
                .calories(totalCalories)
                .proteinG(totalProtein)
                .carbsG(totalCarbs)
                .fatG(totalFat)
                .fiberG(totalFiber)
                .sugarG(totalSugar)
                .sodiumMg(totalSodium)
                .cholesterolMg(totalCholesterol)
                .saturatedFatG(totalSaturatedFat)
                .transFatG(totalTransFat)
                .potassiumMg(totalPotassium)
                .build();
    }

    private BigDecimal addSafe(BigDecimal total, BigDecimal value) {
        return value != null ? total.add(value) : total;
    }
}
