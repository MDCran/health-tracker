package dev.zeroday.health.workout.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.workout.model.Exercise;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ExerciseDbClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public ExerciseDbClient(
            @Value("${exercisedb.api-key:}") String apiKey,
            @Value("${exercisedb.base-url:https://exercisedb.p.rapidapi.com}") String baseUrl,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.enabled = StringUtils.hasText(apiKey);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-RapidAPI-Key", apiKey)
                .defaultHeader("X-RapidAPI-Host", "exercisedb.p.rapidapi.com")
                .build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public List<Exercise> searchByName(String name, int limit) {
        if (!enabled) return Collections.emptyList();
        try {
            String json = restClient.get()
                    .uri("/exercises/name/{name}?limit={limit}", name, limit)
                    .retrieve()
                    .body(String.class);
            return parseExercises(json);
        } catch (Exception e) {
            log.warn("ExerciseDB search failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<Exercise> getByBodyPart(String bodyPart, int limit) {
        if (!enabled) return Collections.emptyList();
        try {
            String json = restClient.get()
                    .uri("/exercises/bodyPart/{bodyPart}?limit={limit}", bodyPart, limit)
                    .retrieve()
                    .body(String.class);
            return parseExercises(json);
        } catch (Exception e) {
            log.warn("ExerciseDB bodyPart query failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<Exercise> getByTarget(String target, int limit) {
        if (!enabled) return Collections.emptyList();
        try {
            String json = restClient.get()
                    .uri("/exercises/target/{target}?limit={limit}", target, limit)
                    .retrieve()
                    .body(String.class);
            return parseExercises(json);
        } catch (Exception e) {
            log.warn("ExerciseDB target query failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Exercise> parseExercises(String json) {
        try {
            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            return items.stream().map(this::mapToExercise).toList();
        } catch (Exception e) {
            log.warn("Failed to parse ExerciseDB response: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private Exercise mapToExercise(Map<String, Object> data) {
        Exercise ex = new Exercise();
        ex.setSourceId(String.valueOf(data.get("id")));
        ex.setSource("EXERCISEDB");
        ex.setName((String) data.get("name"));
        ex.setBodyPart((String) data.get("bodyPart"));
        ex.setTargetMuscle((String) data.get("target"));
        ex.setEquipment((String) data.get("equipment"));
        ex.setGifUrl((String) data.get("gifUrl"));

        Object secondaryObj = data.get("secondaryMuscles");
        if (secondaryObj instanceof List<?> list) {
            ex.setSecondaryMuscles(list.stream().map(Object::toString).toList());
        }

        Object instructionsObj = data.get("instructions");
        if (instructionsObj instanceof List<?> list) {
            ex.setInstructions(list.stream().map(Object::toString).toList());
        }

        if (ex.getTargetMuscle() != null) {
            ex.setPrimaryMuscles(List.of(ex.getTargetMuscle()));
        }

        ex.setCustom(false);
        return ex;
    }
}
