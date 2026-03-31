package dev.zeroday.health.substance.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "custom_substance_type")
@Getter
@Setter
@NoArgsConstructor
public class CustomSubstanceType extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String key;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 7)
    private String color = "#64748b";
}
