package dev.zeroday.health.photos.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.integrations.GoogleDriveService;
import dev.zeroday.health.photos.dto.ProgressPhotoResponse;
import dev.zeroday.health.photos.model.ProgressPhoto;
import dev.zeroday.health.photos.repository.ProgressPhotoRepository;
import dev.zeroday.health.user.UserProfile;
import dev.zeroday.health.user.UserProfileRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressPhotoService {

    private final ProgressPhotoRepository photoRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final GoogleDriveService googleDriveService;
    private final UserProfileRepository userProfileRepository;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @Transactional
    public ProgressPhotoResponse uploadPhoto(MultipartFile file, Long workoutSessionId,
                                              BigDecimal weightKg, String notes,
                                              LocalDate takenAt,
                                              Map<String, Object> metricsSnapshot) {
        Long userId = userService.getCurrentUserId();

        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.'))
                : ".jpg";
        String storedName = UUID.randomUUID() + extension;

        String driveFileId = null;
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile != null && profile.isGoogleConnected() && profile.getGoogleDriveFolderId() != null) {
            try {
                byte[] bytes = file.getBytes();
                String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
                driveFileId = googleDriveService.uploadBinaryFile(
                        profile.getGoogleDriveFolderId(), "photos", storedName, bytes, mimeType);
                log.info("Uploaded photo to Google Drive: fileId={}", driveFileId);
            } catch (Exception e) {
                log.warn("Failed to upload photo to Google Drive, falling back to local storage", e);
                driveFileId = null;
            }
        }

        Path userDir = Paths.get(uploadDir, "photos", userId.toString());
        if (driveFileId == null) {
            try {
                Files.createDirectories(userDir);
                Path target = userDir.resolve(storedName);
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store photo", e);
            }
        }

        ProgressPhoto photo = new ProgressPhoto();
        photo.setUserId(userId);
        photo.setWorkoutSessionId(workoutSessionId);
        photo.setFilePath(userDir.resolve(storedName).toString());
        photo.setFileName(originalName != null ? originalName : storedName);
        photo.setTakenAt(takenAt != null
                ? takenAt.atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.now());
        photo.setWeightKg(weightKg);
        photo.setNotes(notes);
        photo.setDriveFileId(driveFileId);

        if (metricsSnapshot != null && !metricsSnapshot.isEmpty()) {
            try {
                photo.setMetricsSnapshot(objectMapper.writeValueAsString(metricsSnapshot));
            } catch (Exception e) {
                log.warn("Failed to serialize metrics snapshot", e);
            }
        }

        photo = photoRepository.save(photo);
        return ProgressPhotoResponse.from(photo, "");
    }

    @Transactional(readOnly = true)
    public List<ProgressPhotoResponse> listPhotos(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        List<ProgressPhoto> photos;

        if (from != null && to != null) {
            Instant fromInstant = from.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant toInstant = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            photos = photoRepository.findByUserIdAndTakenAtBetweenOrderByTakenAtDesc(userId, fromInstant, toInstant);
        } else {
            photos = photoRepository.findByUserIdOrderByTakenAtDesc(userId);
        }

        return photos.stream()
                .map(p -> ProgressPhotoResponse.from(p, ""))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProgressPhotoResponse getPhoto(Long id) {
        Long userId = userService.getCurrentUserId();
        ProgressPhoto photo = photoRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("ProgressPhoto", id));
        return ProgressPhotoResponse.from(photo, "");
    }

    @Transactional(readOnly = true)
    public byte[] getImageBytes(Long id) {
        Long userId = userService.getCurrentUserId();
        ProgressPhoto photo = photoRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("ProgressPhoto", id));

        if (photo.getDriveFileId() != null) {
            try {
                return googleDriveService.downloadBinaryFile(photo.getDriveFileId());
            } catch (Exception e) {
                log.warn("Failed to download photo from Google Drive (fileId={}), falling back to local",
                        photo.getDriveFileId(), e);
            }
        }

        try {
            return Files.readAllBytes(Paths.get(photo.getFilePath()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read photo file", e);
        }
    }

    @Transactional(readOnly = true)
    public String getContentType(Long id) {
        Long userId = userService.getCurrentUserId();
        ProgressPhoto photo = photoRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("ProgressPhoto", id));
        String path = photo.getFilePath().toLowerCase();
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".gif")) return "image/gif";
        if (path.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    @Transactional
    public void deletePhoto(Long id) {
        Long userId = userService.getCurrentUserId();
        ProgressPhoto photo = photoRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("ProgressPhoto", id));

        if (photo.getDriveFileId() != null) {
            try {
                googleDriveService.deleteFile(photo.getDriveFileId());
                log.info("Deleted photo from Google Drive: fileId={}", photo.getDriveFileId());
            } catch (Exception e) {
                log.warn("Failed to delete photo from Google Drive (fileId={})", photo.getDriveFileId(), e);
            }
        }

        try {
            Files.deleteIfExists(Paths.get(photo.getFilePath()));
        } catch (IOException e) {
            log.warn("Failed to delete local photo file: {}", photo.getFilePath(), e);
        }

        photoRepository.delete(photo);
    }
}
