package dev.zeroday.health.medical.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.integrations.GoogleDriveService;
import dev.zeroday.health.medical.dto.MedicalRecordRequest;
import dev.zeroday.health.medical.dto.MedicalRecordResponse;
import dev.zeroday.health.medical.model.MedicalRecord;
import dev.zeroday.health.medical.repository.MedicalRecordRepository;
import dev.zeroday.health.user.UserProfile;
import dev.zeroday.health.user.UserProfileRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private static final String SUBFOLDER = "medical-records";

    private final MedicalRecordRepository medicalRecordRepository;
    private final GoogleDriveService googleDriveService;
    private final UserService userService;
    private final UserProfileRepository userProfileRepository;

    @Transactional
    public MedicalRecordResponse create(MultipartFile file, MedicalRecordRequest request) {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = userProfileRepository.findByUserId(userId).orElseThrow();

        if (!profile.isGoogleConnected()) {
            throw new IllegalStateException("Google Drive not connected. Connect Google Drive first.");
        }

        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.'))
                : "";
        String storedName = UUID.randomUUID() + extension;

        String driveFileId;
        try {
            driveFileId = googleDriveService.uploadBinaryFile(
                    profile.getGoogleDriveFolderId(),
                    SUBFOLDER,
                    storedName,
                    file.getBytes(),
                    file.getContentType() != null ? file.getContentType() : "application/octet-stream"
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Google Drive", e);
        }

        MedicalRecord record = new MedicalRecord();
        record.setUserId(userId);
        record.setName(request.getName());
        record.setProviderName(request.getProviderName());
        record.setDoctorName(request.getDoctorName());
        record.setRecordDate(request.getRecordDate());
        record.setNotes(request.getNotes());
        record.setDriveFileId(driveFileId);
        record.setMimeType(file.getContentType());
        record.setFileSize(file.getSize());

        record = medicalRecordRepository.save(record);
        return MedicalRecordResponse.from(record);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> list() {
        Long userId = userService.getCurrentUserId();
        return medicalRecordRepository.findByUserIdOrderByRecordDateDesc(userId)
                .stream().map(MedicalRecordResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse getById(Long id) {
        Long userId = userService.getCurrentUserId();
        MedicalRecord record = medicalRecordRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", id));
        return MedicalRecordResponse.from(record);
    }

    @Transactional(readOnly = true)
    public byte[] getFile(Long id) {
        Long userId = userService.getCurrentUserId();
        MedicalRecord record = medicalRecordRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", id));

        if (record.getDriveFileId() == null) {
            throw new IllegalStateException("No file associated with this medical record");
        }

        try {
            return googleDriveService.downloadBinaryFile(record.getDriveFileId());
        } catch (IOException e) {
            throw new RuntimeException("Failed to download file from Google Drive", e);
        }
    }

    @Transactional(readOnly = true)
    public String getMimeType(Long id) {
        Long userId = userService.getCurrentUserId();
        MedicalRecord record = medicalRecordRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", id));
        return record.getMimeType() != null ? record.getMimeType() : "application/octet-stream";
    }

    @Transactional
    public void delete(Long id) {
        Long userId = userService.getCurrentUserId();
        MedicalRecord record = medicalRecordRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", id));

        if (record.getDriveFileId() != null) {
            try {
                googleDriveService.deleteFile(record.getDriveFileId());
            } catch (IOException e) {
                log.warn("Failed to delete file from Google Drive: {}", record.getDriveFileId(), e);
            }
        }

        medicalRecordRepository.delete(record);
    }
}
