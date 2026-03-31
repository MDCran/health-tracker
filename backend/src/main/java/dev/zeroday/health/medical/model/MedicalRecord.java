package dev.zeroday.health.medical.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "medical_record")
@Getter
@Setter
@NoArgsConstructor
public class MedicalRecord extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "provider_name", length = 255)
    private String providerName;

    @Column(name = "doctor_name", length = 255)
    private String doctorName;

    @Column(name = "record_date")
    private LocalDate recordDate;

    @Column(name = "drive_file_id", length = 100)
    private String driveFileId;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(columnDefinition = "text")
    private String notes;
}
