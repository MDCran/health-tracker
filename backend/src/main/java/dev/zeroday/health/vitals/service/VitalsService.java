package dev.zeroday.health.vitals.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.user.UserService;
import dev.zeroday.health.vitals.dto.VitalReadingRequest;
import dev.zeroday.health.vitals.dto.VitalReadingResponse;
import dev.zeroday.health.vitals.model.VitalReading;
import dev.zeroday.health.vitals.repository.VitalReadingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VitalsService {

    private final VitalReadingRepository repository;
    private final UserService userService;

    @Transactional
    public VitalReadingResponse create(VitalReadingRequest request) {
        Long userId = userService.getCurrentUserId();
        VitalReading v = new VitalReading();
        v.setUserId(userId);
        v.setVitalType(request.getVitalType());
        v.setCustomName(request.getCustomName());
        v.setValue(request.getValue());
        v.setValue2(request.getValue2());
        v.setUnit(request.getUnit());
        v.setMeasuredAt(request.getMeasuredAt() != null ? request.getMeasuredAt() : Instant.now());
        v.setNotes(request.getNotes());
        return VitalReadingResponse.from(repository.save(v));
    }

    @Transactional(readOnly = true)
    public List<VitalReadingResponse> list(String vitalType, Instant from, Instant to) {
        Long userId = userService.getCurrentUserId();
        List<VitalReading> readings;
        if (vitalType != null && from != null && to != null) {
            readings = repository.findByUserIdAndVitalTypeAndMeasuredAtBetween(userId, vitalType, from, to);
        } else if (vitalType != null) {
            readings = repository.findByUserIdAndVitalTypeOrderByMeasuredAtDesc(userId, vitalType);
        } else {
            readings = repository.findByUserIdOrderByMeasuredAtDesc(userId);
        }
        return readings.stream().map(VitalReadingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, VitalReadingResponse> getLatest() {
        Long userId = userService.getCurrentUserId();
        List<String> types = repository.findDistinctVitalTypesByUserId(userId);
        Map<String, VitalReadingResponse> latest = new LinkedHashMap<>();
        for (String type : types) {
            repository.findTopByUserIdAndVitalTypeOrderByMeasuredAtDesc(userId, type)
                    .ifPresent(v -> latest.put(type, VitalReadingResponse.from(v)));
        }
        return latest;
    }

    @Transactional
    public void delete(Long id) {
        Long userId = userService.getCurrentUserId();
        VitalReading v = repository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("VitalReading", id));
        repository.delete(v);
    }

    @Transactional(readOnly = true)
    public List<String> getLoggedTypes() {
        return repository.findDistinctVitalTypesByUserId(userService.getCurrentUserId());
    }
}
