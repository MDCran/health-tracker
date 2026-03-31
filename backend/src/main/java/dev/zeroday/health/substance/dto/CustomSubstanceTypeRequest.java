package dev.zeroday.health.substance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomSubstanceTypeRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String color;
}
