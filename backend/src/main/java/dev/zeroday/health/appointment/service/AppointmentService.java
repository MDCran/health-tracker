package dev.zeroday.health.appointment.service;

import dev.zeroday.health.appointment.dto.AppointmentRequest;
import dev.zeroday.health.appointment.dto.AppointmentResponse;
import dev.zeroday.health.appointment.model.Appointment;
import dev.zeroday.health.appointment.repository.AppointmentRepository;
import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<AppointmentResponse> list() {
        Long userId = userService.getCurrentUserId();
        return appointmentRepository.findByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(userId)
                .stream().map(AppointmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listBetween(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        return appointmentRepository.findByUserIdAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(userId, from, to)
                .stream().map(AppointmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        Long userId = userService.getCurrentUserId();
        Appointment a = appointmentRepository.findById(id)
                .filter(apt -> apt.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        return AppointmentResponse.from(a);
    }

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        Long userId = userService.getCurrentUserId();
        Appointment a = new Appointment();
        a.setUserId(userId);
        applyFields(a, request);
        return AppointmentResponse.from(appointmentRepository.save(a));
    }

    @Transactional
    public AppointmentResponse update(Long id, AppointmentRequest request) {
        Long userId = userService.getCurrentUserId();
        Appointment a = appointmentRepository.findById(id)
                .filter(apt -> apt.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        applyFields(a, request);
        return AppointmentResponse.from(appointmentRepository.save(a));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = userService.getCurrentUserId();
        Appointment a = appointmentRepository.findById(id)
                .filter(apt -> apt.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        appointmentRepository.delete(a);
    }

    private void applyFields(Appointment a, AppointmentRequest r) {
        if (r.getTitle() != null) a.setTitle(r.getTitle());
        if (r.getDoctorName() != null) a.setDoctorName(r.getDoctorName());
        if (r.getOfficeName() != null) a.setOfficeName(r.getOfficeName());
        if (r.getSpecialty() != null) a.setSpecialty(r.getSpecialty());
        if (r.getLocation() != null) a.setLocation(r.getLocation());
        if (r.getAppointmentDate() != null) a.setAppointmentDate(r.getAppointmentDate());
        if (r.getAppointmentTime() != null) a.setAppointmentTime(r.getAppointmentTime());
        if (r.getDurationMinutes() != null) a.setDurationMinutes(r.getDurationMinutes());
        if (r.getNotes() != null) a.setNotes(r.getNotes());
        if (r.getStatus() != null) a.setStatus(r.getStatus());
    }
}
