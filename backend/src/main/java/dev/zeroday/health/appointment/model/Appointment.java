package dev.zeroday.health.appointment.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointment")
@Getter
@Setter
@NoArgsConstructor
public class Appointment extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "doctor_name", length = 200)
    private String doctorName;

    @Column(name = "office_name", length = 200)
    private String officeName;

    @Column(length = 100)
    private String specialty;

    @Column(length = 500)
    private String location;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time")
    private LocalTime appointmentTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED";
}
