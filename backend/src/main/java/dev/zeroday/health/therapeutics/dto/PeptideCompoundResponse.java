package dev.zeroday.health.therapeutics.dto;

import dev.zeroday.health.therapeutics.model.PeptideCompound;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@AllArgsConstructor
public class PeptideCompoundResponse {

    private Long id;
    private String compoundName;
    private BigDecimal amountMg;
    private Instant createdAt;

    public static PeptideCompoundResponse from(PeptideCompound compound) {
        return new PeptideCompoundResponse(
                compound.getId(),
                compound.getCompoundName(),
                compound.getAmountMg(),
                compound.getCreatedAt()
        );
    }
}
