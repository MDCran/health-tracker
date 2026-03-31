package dev.zeroday.health.therapeutics.controller;

import dev.zeroday.health.therapeutics.dto.SupplementRequest;
import dev.zeroday.health.therapeutics.dto.SupplementResponse;
import dev.zeroday.health.therapeutics.service.SupplementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/supplements")
@RequiredArgsConstructor
public class SupplementController {

    private final SupplementService supplementService;

    @GetMapping
    public ResponseEntity<List<SupplementResponse>> listSupplements(
            @RequestParam(name = "all", defaultValue = "false") boolean includeInactive) {
        List<SupplementResponse> supplements = includeInactive ?
                supplementService.getAllSupplements() : supplementService.getActiveSupplements();
        return ResponseEntity.ok(supplements);
    }

    @PostMapping
    public ResponseEntity<SupplementResponse> createSupplement(@Valid @RequestBody SupplementRequest request) {
        SupplementResponse response = supplementService.createSupplement(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplementResponse> getSupplement(@PathVariable Long id) {
        return ResponseEntity.ok(supplementService.getSupplement(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplementResponse> updateSupplement(@PathVariable Long id,
                                                                @Valid @RequestBody SupplementRequest request) {
        return ResponseEntity.ok(supplementService.updateSupplement(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplement(@PathVariable Long id) {
        supplementService.deleteSupplement(id);
        return ResponseEntity.noContent().build();
    }
}
