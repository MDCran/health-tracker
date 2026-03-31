package dev.zeroday.health.medical.dto;

import dev.zeroday.health.medical.model.MedicalRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordResponse {
    private Long id;
    private String name;
    private String providerName;
    private String doctorName;
    private LocalDate recordDate;
    private String driveFileId;
    private String mimeType;
    private Long fileSize;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static MedicalRecordResponse from(MedicalRecord r) {
        return MedicalRecordResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .providerName(r.getProviderName())
                .doctorName(r.getDoctorName())
                .recordDate(r.getRecordDate())
                .driveFileId(r.getDriveFileId())
                .mimeType(r.getMimeType())
                .fileSize(r.getFileSize())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
