package dev.zeroday.health.therapeutics.controller;

import dev.zeroday.health.therapeutics.dto.PeptideRequest;
import dev.zeroday.health.therapeutics.dto.PeptideResponse;
import dev.zeroday.health.therapeutics.dto.ReconstitutionResponse;
import dev.zeroday.health.therapeutics.service.PeptideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/peptides")
@RequiredArgsConstructor
public class PeptideController {

    private final PeptideService peptideService;

    @GetMapping
    public ResponseEntity<List<PeptideResponse>> listPeptides(
            @RequestParam(name = "all", defaultValue = "false") boolean includeInactive) {
        List<PeptideResponse> peptides = includeInactive ?
                peptideService.getAllPeptides() : peptideService.getActivePeptides();
        return ResponseEntity.ok(peptides);
    }

    @PostMapping
    public ResponseEntity<PeptideResponse> createPeptide(@Valid @RequestBody PeptideRequest request) {
        PeptideResponse response = peptideService.createPeptide(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PeptideResponse> getPeptide(@PathVariable Long id) {
        return ResponseEntity.ok(peptideService.getPeptide(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PeptideResponse> updatePeptide(@PathVariable Long id,
                                                          @Valid @RequestBody PeptideRequest request) {
        return ResponseEntity.ok(peptideService.updatePeptide(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePeptide(@PathVariable Long id) {
        peptideService.deletePeptide(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/reconstitution")
    public ResponseEntity<ReconstitutionResponse> getReconstitution(@PathVariable Long id) {
        return ResponseEntity.ok(peptideService.getReconstitution(id));
    }
}
