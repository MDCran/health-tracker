package dev.zeroday.health.medical.controller;

import dev.zeroday.health.medical.dto.MedicalRecordRequest;
import dev.zeroday.health.medical.dto.MedicalRecordResponse;
import dev.zeroday.health.medical.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MedicalRecordResponse> create(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam(value = "providerName", required = false) String providerName,
            @RequestParam(value = "doctorName", required = false) String doctorName,
            @RequestParam(value = "recordDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate recordDate,
            @RequestParam(value = "notes", required = false) String notes) {

        MedicalRecordRequest request = new MedicalRecordRequest();
        request.setName(name);
        request.setProviderName(providerName);
        request.setDoctorName(doctorName);
        request.setRecordDate(recordDate);
        request.setNotes(notes);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(medicalRecordService.create(file, request));
    }

    @GetMapping
    public ResponseEntity<List<MedicalRecordResponse>> list() {
        return ResponseEntity.ok(medicalRecordService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecordResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(medicalRecordService.getById(id));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable Long id) {
        String mimeType = medicalRecordService.getMimeType(id);
        byte[] bytes = medicalRecordService.getFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .body(bytes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicalRecordService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
