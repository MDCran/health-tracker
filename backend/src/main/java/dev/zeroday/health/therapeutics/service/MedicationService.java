package dev.zeroday.health.therapeutics.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.therapeutics.dto.MedicationRequest;
import dev.zeroday.health.therapeutics.dto.MedicationResponse;
import dev.zeroday.health.therapeutics.model.Medication;
import dev.zeroday.health.therapeutics.repository.MedicationRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<MedicationResponse> getActiveMedications() {
        Long userId = userService.getCurrentUserId();
        return medicationRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(MedicationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicationResponse> getAllMedications() {
        Long userId = userService.getCurrentUserId();
        return medicationRepository.findByUserId(userId).stream()
                .map(MedicationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicationResponse getMedication(Long id) {
        Medication medication = findByIdForCurrentUser(id);
        return MedicationResponse.from(medication);
    }

    @Transactional
    public MedicationResponse createMedication(MedicationRequest request) {
        Long userId = userService.getCurrentUserId();

        Medication medication = new Medication();
        medication.setUserId(userId);
        medication.setName(request.getName());
        medication.setDosageAmount(request.getDosageAmount());
        medication.setDosageUnit(request.getDosageUnit());
        medication.setFrequency(request.getFrequency());
        medication.setNotes(request.getNotes());
        medication.setActive(true);

        medication = medicationRepository.save(medication);
        return MedicationResponse.from(medication);
    }

    @Transactional
    public MedicationResponse updateMedication(Long id, MedicationRequest request) {
        Medication medication = findByIdForCurrentUser(id);

        medication.setName(request.getName());
        medication.setDosageAmount(request.getDosageAmount());
        medication.setDosageUnit(request.getDosageUnit());
        medication.setFrequency(request.getFrequency());
        medication.setNotes(request.getNotes());

        medication = medicationRepository.save(medication);
        return MedicationResponse.from(medication);
    }

    @Transactional
    public void deleteMedication(Long id) {
        Medication medication = findByIdForCurrentUser(id);
        medication.setActive(false);
        medicationRepository.save(medication);
    }

    private Medication findByIdForCurrentUser(Long id) {
        Long userId = userService.getCurrentUserId();
        return medicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication", id));
    }
}
