package dev.zeroday.health.workout.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.workout.model.Exercise;
import dev.zeroday.health.workout.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.*;

@Slf4j
@Service
public class ExerciseSyncService {

    private final ExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;

    @Value("${exercisedb.api-key:}")
    private String exerciseDbKey;

    @Value("${exercisedb.base-url:https://exercisedb.p.rapidapi.com}")
    private String exerciseDbUrl;

    @Value("${musclewiki.api-key:}")
    private String muscleWikiKey;

    @Value("${musclewiki.base-url:https://api.musclewiki.com}")
    private String muscleWikiUrl;

    public ExerciseSyncService(ExerciseRepository exerciseRepository, ObjectMapper objectMapper) {
        this.exerciseRepository = exerciseRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> syncExerciseDb() {
        if (!StringUtils.hasText(exerciseDbKey)) {
            return Map.of("status", "skipped", "reason", "No ExerciseDB API key configured");
        }

        long existing = exerciseRepository.countBySource("EXERCISEDB");
        if (existing > 100) {
            return Map.of("status", "skipped", "reason", "Already synced " + existing + " exercises from ExerciseDB");
        }

        RestClient client = RestClient.builder()
                .baseUrl(exerciseDbUrl)
                .defaultHeader("X-RapidAPI-Key", exerciseDbKey)
                .defaultHeader("X-RapidAPI-Host", "exercisedb.p.rapidapi.com")
                .build();

        int saved = 0;
        int skipped = 0;

        try {
            String json = client.get()
                    .uri("/exercises?limit=1300")
                    .retrieve()
                    .body(String.class);

            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            log.info("ExerciseDB returned {} exercises", items.size());

            for (Map<String, Object> item : items) {
                String sourceId = String.valueOf(item.get("id"));
                Optional<Exercise> exists = exerciseRepository.findBySourceAndSourceId("EXERCISEDB", sourceId);
                if (exists.isPresent()) {
                    skipped++;
                    continue;
                }

                Exercise ex = new Exercise();
                ex.setSource("EXERCISEDB");
                ex.setSourceId(sourceId);
                ex.setName(capitalize((String) item.get("name")));
                ex.setBodyPart((String) item.get("bodyPart"));
                ex.setTargetMuscle((String) item.get("target"));
                ex.setEquipment((String) item.get("equipment"));
                ex.setGifUrl((String) item.get("gifUrl"));

                if (item.get("secondaryMuscles") instanceof List<?> list) {
                    ex.setSecondaryMuscles(list.stream().map(Object::toString).toList());
                }
                if (item.get("instructions") instanceof List<?> list) {
                    ex.setInstructions(list.stream().map(Object::toString).toList());
                }
                if (ex.getTargetMuscle() != null) {
                    ex.setPrimaryMuscles(List.of(ex.getTargetMuscle()));
                }
                ex.setCustom(false);
                exerciseRepository.save(ex);
                saved++;
            }
        } catch (Exception e) {
            log.error("ExerciseDB sync failed: {}", e.getMessage(), e);
            return Map.of("status", "error", "message", e.getMessage(), "saved", saved, "skipped", skipped);
        }

        log.info("ExerciseDB sync complete: {} saved, {} skipped", saved, skipped);
        return Map.of("status", "success", "saved", saved, "skipped", skipped);
    }

    @Transactional
    public Map<String, Object> syncMuscleWiki() {
        if (!StringUtils.hasText(muscleWikiKey)) {
            return Map.of("status", "skipped", "reason", "No MuscleWiki API key configured");
        }

        long existing = exerciseRepository.countBySource("MUSCLEWIKI");
        if (existing > 100) {
            return Map.of("status", "skipped", "reason", "Already synced " + existing + " exercises from MuscleWiki");
        }

        RestClient client = RestClient.builder()
                .baseUrl(muscleWikiUrl)
                .defaultHeader("X-API-Key", muscleWikiKey)
                .build();

        int saved = 0;
        int skipped = 0;

        try {
            String json = client.get()
                    .uri("/exercises?limit=2000")
                    .retrieve()
                    .body(String.class);

            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            log.info("MuscleWiki returned {} exercises", items.size());

            for (Map<String, Object> item : items) {
                String sourceId = String.valueOf(item.get("id"));
                Optional<Exercise> exists = exerciseRepository.findBySourceAndSourceId("MUSCLEWIKI", sourceId);
                if (exists.isPresent()) {
                    skipped++;
                    continue;
                }

                Exercise ex = new Exercise();
                ex.setSource("MUSCLEWIKI");
                ex.setSourceId(sourceId);
                ex.setName(capitalize((String) item.get("name")));
                ex.setEquipment((String) item.get("category"));
                ex.setForceType((String) item.get("force"));
                ex.setMechanic((String) item.get("mechanic"));
                ex.setDifficulty((String) item.get("difficulty"));

                if (item.get("primary_muscles") instanceof List<?> list) {
                    ex.setPrimaryMuscles(list.stream().map(Object::toString).toList());
                    if (!list.isEmpty()) ex.setTargetMuscle(list.get(0).toString());
                }
                if (item.get("steps") instanceof List<?> list) {
                    ex.setInstructions(list.stream().map(Object::toString).toList());
                }
                if (item.get("videos") instanceof List<?> list) {
                    ex.setVideoUrls(list.stream().map(v -> {
                        if (v instanceof Map<?, ?> vMap) {
                            Object url = vMap.get("url");
                            return url != null ? url.toString() : "";
                        }
                        return v.toString();
                    }).filter(s -> !s.isEmpty()).toList());
                }

                ex.setCustom(false);
                exerciseRepository.save(ex);
                saved++;
            }
        } catch (Exception e) {
            log.error("MuscleWiki sync failed: {}", e.getMessage(), e);
            return Map.of("status", "error", "message", e.getMessage(), "saved", saved, "skipped", skipped);
        }

        log.info("MuscleWiki sync complete: {} saved, {} skipped", saved, skipped);
        return Map.of("status", "success", "saved", saved, "skipped", skipped);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
