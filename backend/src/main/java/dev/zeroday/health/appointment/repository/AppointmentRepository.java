package dev.zeroday.health.appointment.repository;

import dev.zeroday.health.appointment.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(Long userId);

    List<Appointment> findByUserIdAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(
            Long userId, LocalDate from, LocalDate to);

    List<Appointment> findByUserIdAndAppointmentDateOrderByAppointmentTimeAsc(Long userId, LocalDate date);
}
