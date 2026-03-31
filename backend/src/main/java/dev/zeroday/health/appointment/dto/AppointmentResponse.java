package dev.zeroday.health.appointment.dto;

import dev.zeroday.health.appointment.model.Appointment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    private Long id;
    private String title;
    private String doctorName;
    private String officeName;
    private String specialty;
    private String location;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private Integer durationMinutes;
    private String notes;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public static AppointmentResponse from(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .doctorName(a.getDoctorName())
                .officeName(a.getOfficeName())
                .specialty(a.getSpecialty())
                .location(a.getLocation())
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .durationMinutes(a.getDurationMinutes())
                .notes(a.getNotes())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
