package dev.zeroday.health.therapeutics.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.therapeutics.dto.SupplementRequest;
import dev.zeroday.health.therapeutics.dto.SupplementResponse;
import dev.zeroday.health.therapeutics.model.Supplement;
import dev.zeroday.health.therapeutics.repository.SupplementRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplementService {

    private final SupplementRepository supplementRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<SupplementResponse> getActiveSupplements() {
        Long userId = userService.getCurrentUserId();
        return supplementRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(SupplementResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupplementResponse> getAllSupplements() {
        Long userId = userService.getCurrentUserId();
        return supplementRepository.findByUserId(userId).stream()
                .map(SupplementResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplementResponse getSupplement(Long id) {
        Supplement supplement = findByIdForCurrentUser(id);
        return SupplementResponse.from(supplement);
    }

    @Transactional
    public SupplementResponse createSupplement(SupplementRequest request) {
        Long userId = userService.getCurrentUserId();

        Supplement supplement = new Supplement();
        supplement.setUserId(userId);
        supplement.setName(request.getName());
        supplement.setDosageAmount(request.getDosageAmount());
        supplement.setDosageUnit(request.getDosageUnit());
        supplement.setFrequency(request.getFrequency());
        supplement.setNotes(request.getNotes());
        supplement.setActive(true);

        supplement = supplementRepository.save(supplement);
        return SupplementResponse.from(supplement);
    }

    @Transactional
    public SupplementResponse updateSupplement(Long id, SupplementRequest request) {
        Supplement supplement = findByIdForCurrentUser(id);

        supplement.setName(request.getName());
        supplement.setDosageAmount(request.getDosageAmount());
        supplement.setDosageUnit(request.getDosageUnit());
        supplement.setFrequency(request.getFrequency());
        supplement.setNotes(request.getNotes());

        supplement = supplementRepository.save(supplement);
        return SupplementResponse.from(supplement);
    }

    @Transactional
    public void deleteSupplement(Long id) {
        Supplement supplement = findByIdForCurrentUser(id);
        supplement.setActive(false);
        supplementRepository.save(supplement);
    }

    private Supplement findByIdForCurrentUser(Long id) {
        Long userId = userService.getCurrentUserId();
        return supplementRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplement", id));
    }
}
