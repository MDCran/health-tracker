package dev.zeroday.health.photos.controller;

import dev.zeroday.health.photos.dto.ProgressPhotoResponse;
import dev.zeroday.health.photos.service.ProgressPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/photos")
@RequiredArgsConstructor
public class ProgressPhotoController {

    private final ProgressPhotoService photoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProgressPhotoResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "workoutSessionId", required = false) Long workoutSessionId,
            @RequestParam(value = "weightKg", required = false) BigDecimal weightKg,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "takenAt", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate takenAt,
            @RequestParam(value = "chest", required = false) BigDecimal chest,
            @RequestParam(value = "waist", required = false) BigDecimal waist,
            @RequestParam(value = "hips", required = false) BigDecimal hips,
            @RequestParam(value = "leftArm", required = false) BigDecimal leftArm,
            @RequestParam(value = "rightArm", required = false) BigDecimal rightArm,
            @RequestParam(value = "leftThigh", required = false) BigDecimal leftThigh,
            @RequestParam(value = "rightThigh", required = false) BigDecimal rightThigh,
            @RequestParam(value = "shoulders", required = false) BigDecimal shoulders) {

        Map<String, Object> metrics = new HashMap<>();
        if (chest != null) metrics.put("chest", chest);
        if (waist != null) metrics.put("waist", waist);
        if (hips != null) metrics.put("hips", hips);
        if (leftArm != null) metrics.put("leftArm", leftArm);
        if (rightArm != null) metrics.put("rightArm", rightArm);
        if (leftThigh != null) metrics.put("leftThigh", leftThigh);
        if (rightThigh != null) metrics.put("rightThigh", rightThigh);
        if (shoulders != null) metrics.put("shoulders", shoulders);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(photoService.uploadPhoto(file, workoutSessionId, weightKg, notes, takenAt, metrics));
    }

    @GetMapping
    public ResponseEntity<List<ProgressPhotoResponse>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(photoService.listPhotos(from, to));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProgressPhotoResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(photoService.getPhoto(id));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable Long id) {
        String contentType = photoService.getContentType(id);
        byte[] bytes = photoService.getImageBytes(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(bytes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        photoService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }
}
