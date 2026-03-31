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
public class MuscleWikiClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public MuscleWikiClient(
            @Value("${musclewiki.api-key:}") String apiKey,
            @Value("${musclewiki.base-url:https://api.musclewiki.com}") String baseUrl,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.enabled = StringUtils.hasText(apiKey);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public List<Exercise> search(String query, int limit) {
        if (!enabled) return Collections.emptyList();
        try {
            String json = restClient.get()
                    .uri("/search?name={name}&limit={limit}", query, limit)
                    .retrieve()
                    .body(String.class);
            return parseExercises(json);
        } catch (Exception e) {
            log.warn("MuscleWiki search failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<Exercise> getByMuscle(String muscle, int limit) {
        if (!enabled) return Collections.emptyList();
        try {
            String json = restClient.get()
                    .uri("/exercises?muscle={muscle}&limit={limit}", muscle, limit)
                    .retrieve()
                    .body(String.class);
            return parseExercises(json);
        } catch (Exception e) {
            log.warn("MuscleWiki muscle query failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Exercise> parseExercises(String json) {
        try {
            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            return items.stream().map(this::mapToExercise).toList();
        } catch (Exception e) {
            log.warn("Failed to parse MuscleWiki response: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private Exercise mapToExercise(Map<String, Object> data) {
        Exercise ex = new Exercise();
        ex.setSourceId(String.valueOf(data.get("id")));
        ex.setSource("MUSCLEWIKI");
        ex.setName((String) data.get("name"));

        Object musclesObj = data.get("primary_muscles");
        if (musclesObj instanceof List<?> list) {
            ex.setPrimaryMuscles(list.stream().map(Object::toString).toList());
            if (!list.isEmpty()) {
                ex.setTargetMuscle(list.get(0).toString());
            }
        }

        ex.setEquipment((String) data.get("category"));
        ex.setForceType((String) data.get("force"));
        ex.setMechanic((String) data.get("mechanic"));
        ex.setDifficulty((String) data.get("difficulty"));

        Object stepsObj = data.get("steps");
        if (stepsObj instanceof List<?> list) {
            ex.setInstructions(list.stream().map(Object::toString).toList());
        }

        Object videosObj = data.get("videos");
        if (videosObj instanceof List<?> list) {
            ex.setVideoUrls(list.stream().map(v -> {
                if (v instanceof Map<?, ?> vMap) {
                    Object url = vMap.get("url");
                    return url != null ? url.toString() : "";
                }
                return v.toString();
            }).filter(s -> !s.isEmpty()).toList());
        }

        ex.setCustom(false);
        return ex;
    }
}
