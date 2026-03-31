package dev.zeroday.health.therapeutics.dto;

import dev.zeroday.health.therapeutics.model.Peptide;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@AllArgsConstructor
public class PeptideResponse {

    private Long id;
    private String name;
    private BigDecimal totalAmountMg;
    private BigDecimal bacWaterMl;
    private BigDecimal concentrationMgPerMl;
    private String notes;
    private boolean active;
    private List<PeptideCompoundResponse> compounds;
    private ReconstitutionResponse reconstitution;
    private Instant createdAt;
    private Instant updatedAt;

    public static PeptideResponse from(Peptide peptide) {
        return from(peptide, null);
    }

    public static PeptideResponse from(Peptide peptide, ReconstitutionResponse reconstitution) {
        List<PeptideCompoundResponse> compoundResponses = peptide.getCompounds().stream()
                .map(PeptideCompoundResponse::from)
                .toList();

        return new PeptideResponse(
                peptide.getId(),
                peptide.getName(),
                peptide.getTotalAmountMg(),
                peptide.getBacWaterMl(),
                peptide.getConcentrationMgPerMl(),
                peptide.getNotes(),
                peptide.isActive(),
                compoundResponses,
                reconstitution,
                peptide.getCreatedAt(),
                peptide.getUpdatedAt()
        );
    }
}
