package dev.zeroday.health.therapeutics.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "peptide")
@Getter
@Setter
@NoArgsConstructor
public class Peptide extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "total_amount_mg", nullable = false, precision = 10, scale = 4)
    private BigDecimal totalAmountMg;

    @Column(name = "bac_water_ml", nullable = false, precision = 10, scale = 4)
    private BigDecimal bacWaterMl;

    @Column(name = "concentration_mg_per_ml", precision = 10, scale = 6)
    private BigDecimal concentrationMgPerMl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "peptide", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PeptideCompound> compounds = new ArrayList<>();
}
