package dev.zeroday.health.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String doctorName;
    private String officeName;
    private String specialty;
    private String location;

    @NotNull(message = "Date is required")
    private LocalDate appointmentDate;

    private LocalTime appointmentTime;
    private Integer durationMinutes;
    private String notes;
    private String status;
}
