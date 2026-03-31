package dev.zeroday.health.therapeutics.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.therapeutics.dto.*;
import dev.zeroday.health.therapeutics.model.Peptide;
import dev.zeroday.health.therapeutics.model.PeptideCompound;
import dev.zeroday.health.therapeutics.repository.PeptideRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PeptideService {

    private final PeptideRepository peptideRepository;
    private final UserService userService;
    private final ReconstitutionCalculator reconstitutionCalculator;

    @Transactional(readOnly = true)
    public List<PeptideResponse> getActivePeptides() {
        Long userId = userService.getCurrentUserId();
        return peptideRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(this::toResponseWithReconstitution)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PeptideResponse> getAllPeptides() {
        Long userId = userService.getCurrentUserId();
        return peptideRepository.findByUserId(userId).stream()
                .map(this::toResponseWithReconstitution)
                .toList();
    }

    @Transactional(readOnly = true)
    public PeptideResponse getPeptide(Long id) {
        Peptide peptide = findByIdForCurrentUser(id);
        return toResponseWithReconstitution(peptide);
    }

    @Transactional
    public PeptideResponse createPeptide(PeptideRequest request) {
        Long userId = userService.getCurrentUserId();

        Peptide peptide = new Peptide();
        peptide.setUserId(userId);
        peptide.setName(request.getName());
        peptide.setTotalAmountMg(request.getTotalAmountMg());
        peptide.setBacWaterMl(request.getBacWaterMl());
        peptide.setNotes(request.getNotes());
        peptide.setActive(true);

        peptide.setConcentrationMgPerMl(
                reconstitutionCalculator.calculateConcentrationMgPerMl(
                        request.getTotalAmountMg(), request.getBacWaterMl()));

        if (request.getCompounds() != null) {
            List<PeptideCompound> compounds = new ArrayList<>();
            for (PeptideCompoundRequest compoundReq : request.getCompounds()) {
                PeptideCompound compound = new PeptideCompound();
                compound.setPeptide(peptide);
                compound.setCompoundName(compoundReq.getCompoundName());
                compound.setAmountMg(compoundReq.getAmountMg());
                compounds.add(compound);
            }
            peptide.setCompounds(compounds);
        }

        peptide = peptideRepository.save(peptide);
        return toResponseWithReconstitution(peptide);
    }

    @Transactional
    public PeptideResponse updatePeptide(Long id, PeptideRequest request) {
        Peptide peptide = findByIdForCurrentUser(id);

        peptide.setName(request.getName());
        peptide.setTotalAmountMg(request.getTotalAmountMg());
        peptide.setBacWaterMl(request.getBacWaterMl());
        peptide.setNotes(request.getNotes());

        peptide.setConcentrationMgPerMl(
                reconstitutionCalculator.calculateConcentrationMgPerMl(
                        request.getTotalAmountMg(), request.getBacWaterMl()));

        peptide.getCompounds().clear();
        if (request.getCompounds() != null) {
            for (PeptideCompoundRequest compoundReq : request.getCompounds()) {
                PeptideCompound compound = new PeptideCompound();
                compound.setPeptide(peptide);
                compound.setCompoundName(compoundReq.getCompoundName());
                compound.setAmountMg(compoundReq.getAmountMg());
                peptide.getCompounds().add(compound);
            }
        }

        peptide = peptideRepository.save(peptide);
        return toResponseWithReconstitution(peptide);
    }

    @Transactional
    public void deletePeptide(Long id) {
        Peptide peptide = findByIdForCurrentUser(id);
        peptide.setActive(false);
        peptideRepository.save(peptide);
    }

    @Transactional(readOnly = true)
    public ReconstitutionResponse getReconstitution(Long peptideId) {
        Peptide peptide = findByIdForCurrentUser(peptideId);
        return reconstitutionCalculator.calculate(
                peptide.getTotalAmountMg(),
                peptide.getBacWaterMl(),
                peptide.getCompounds()
        );
    }

    private Peptide findByIdForCurrentUser(Long id) {
        Long userId = userService.getCurrentUserId();
        return peptideRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Peptide", id));
    }

    private PeptideResponse toResponseWithReconstitution(Peptide peptide) {
        ReconstitutionResponse reconstitution = reconstitutionCalculator.calculate(
                peptide.getTotalAmountMg(),
                peptide.getBacWaterMl(),
                peptide.getCompounds()
        );
        return PeptideResponse.from(peptide, reconstitution);
    }
}
