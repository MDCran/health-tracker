package dev.zeroday.health.therapeutics.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "peptide_compound")
@Getter
@Setter
@NoArgsConstructor
public class PeptideCompound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "peptide_id", nullable = false)
    private Peptide peptide;

    @Column(name = "compound_name", nullable = false, length = 200)
    private String compoundName;

    @Column(name = "amount_mg", nullable = false, precision = 10, scale = 4)
    private BigDecimal amountMg;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
