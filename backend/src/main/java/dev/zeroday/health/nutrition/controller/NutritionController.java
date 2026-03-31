package dev.zeroday.health.nutrition.controller;

import dev.zeroday.health.nutrition.dto.*;
import dev.zeroday.health.nutrition.service.NutritionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionService nutritionService;

    @GetMapping("/days")
    public ResponseEntity<List<NutritionDayResponse>> getDays(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(nutritionService.getDaysBetween(from, to));
    }

    @GetMapping("/days/{date}")
    public ResponseEntity<NutritionDayResponse> getDay(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(nutritionService.getDayWithMeals(date));
    }

    @PostMapping("/days/{date}/meals")
    public ResponseEntity<MealResponse> addMeal(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody MealRequest request) {
        return ResponseEntity.ok(nutritionService.addMeal(date, request));
    }

    @PutMapping("/meals/{mealId}")
    public ResponseEntity<MealResponse> updateMeal(
            @PathVariable Long mealId,
            @Valid @RequestBody MealRequest request) {
        return ResponseEntity.ok(nutritionService.updateMeal(mealId, request));
    }

    @DeleteMapping("/meals/{mealId}")
    public ResponseEntity<Void> deleteMeal(@PathVariable Long mealId) {
        nutritionService.deleteMeal(mealId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/meals/{mealId}/foods")
    public ResponseEntity<FoodEntryResponse> addFood(
            @PathVariable Long mealId,
            @Valid @RequestBody FoodEntryRequest request) {
        return ResponseEntity.ok(nutritionService.addFoodToMeal(mealId, request));
    }

    @PutMapping("/foods/{foodId}")
    public ResponseEntity<FoodEntryResponse> updateFood(
            @PathVariable Long foodId,
            @Valid @RequestBody FoodEntryRequest request) {
        return ResponseEntity.ok(nutritionService.updateFood(foodId, request));
    }

    @DeleteMapping("/foods/{foodId}")
    public ResponseEntity<Void> deleteFood(@PathVariable Long foodId) {
        nutritionService.deleteFood(foodId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/analyze")
    public ResponseEntity<FoodAnalysisResponse> analyzeFood(
            @Valid @RequestBody FoodAnalysisRequest request) {
        return ResponseEntity.ok(nutritionService.analyzeFoodPreview(request.getDescription()));
    }

    @PostMapping(value = "/foods/{foodId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FoodEntryResponse> uploadFoodImage(
            @PathVariable Long foodId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(nutritionService.uploadFoodImage(foodId, file));
    }

    @GetMapping("/foods/{foodId}/image")
    public ResponseEntity<byte[]> getFoodImage(@PathVariable Long foodId) throws IOException {
        byte[] imageBytes = nutritionService.downloadFoodImage(foodId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(imageBytes);
    }

    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FoodAnalysisResponse> analyzeImage(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(nutritionService.analyzeImagePreview(file.getBytes()));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        String csv = nutritionService.exportCsv(from, to);
        String filename = "nutrition_" + from + "_to_" + to + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.getBytes());
    }
}
