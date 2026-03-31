package dev.zeroday.health.workout.controller;

import dev.zeroday.health.workout.dto.PersonalRecordResponse;
import dev.zeroday.health.workout.service.PersonalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/personal-records")
@RequiredArgsConstructor
public class PersonalRecordController {

    private final PersonalRecordService personalRecordService;

    @GetMapping
    public ResponseEntity<List<PersonalRecordResponse>> getAll() {
        return ResponseEntity.ok(personalRecordService.getAllRecords());
    }

    @GetMapping("/exercise/{exerciseId}")
    public ResponseEntity<List<PersonalRecordResponse>> getByExercise(@PathVariable Long exerciseId) {
        return ResponseEntity.ok(personalRecordService.getRecordsForExercise(exerciseId));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<PersonalRecordResponse>> getRecent() {
        return ResponseEntity.ok(personalRecordService.getRecentRecords());
    }
}
