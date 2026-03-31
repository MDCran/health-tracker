package dev.zeroday.health.therapeutics.controller;

import dev.zeroday.health.therapeutics.dto.MedicationRequest;
import dev.zeroday.health.therapeutics.dto.MedicationResponse;
import dev.zeroday.health.therapeutics.service.MedicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationService medicationService;

    @GetMapping
    public ResponseEntity<List<MedicationResponse>> listMedications(
            @RequestParam(name = "all", defaultValue = "false") boolean includeInactive) {
        List<MedicationResponse> medications = includeInactive ?
                medicationService.getAllMedications() : medicationService.getActiveMedications();
        return ResponseEntity.ok(medications);
    }

    @PostMapping
    public ResponseEntity<MedicationResponse> createMedication(@Valid @RequestBody MedicationRequest request) {
        MedicationResponse response = medicationService.createMedication(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicationResponse> getMedication(@PathVariable Long id) {
        return ResponseEntity.ok(medicationService.getMedication(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicationResponse> updateMedication(@PathVariable Long id,
                                                                @Valid @RequestBody MedicationRequest request) {
        return ResponseEntity.ok(medicationService.updateMedication(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long id) {
        medicationService.deleteMedication(id);
        return ResponseEntity.noContent().build();
    }
}
