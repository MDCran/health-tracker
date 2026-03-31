package dev.zeroday.health.medical.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MedicalRecordRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String providerName;
    private String doctorName;
    private LocalDate recordDate;
    private String notes;
}
