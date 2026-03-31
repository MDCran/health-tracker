package dev.zeroday.health.substance.dto;

import dev.zeroday.health.substance.model.CustomSubstanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomSubstanceTypeResponse {
    private Long id;
    private String key;
    private String name;
    private String color;

    public static CustomSubstanceTypeResponse from(CustomSubstanceType entity) {
        return CustomSubstanceTypeResponse.builder()
                .id(entity.getId())
                .key(entity.getKey())
                .name(entity.getName())
                .color(entity.getColor())
                .build();
    }
}
