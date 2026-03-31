package dev.zeroday.health.workout.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.workout.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.sql.Array;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExerciseSeeder implements ApplicationRunner {

    private final ExerciseRepository exerciseRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void run(ApplicationArguments args) {
        long count = exerciseRepository.countByIsCustomFalse();
        if (count > 0) {
            log.info("Exercise database already seeded with {} exercises, skipping.", count);
            return;
        }

        try {
            ClassPathResource resource = new ClassPathResource("seed/exercises.json");
            if (!resource.exists()) {
                log.warn("seed/exercises.json not found on classpath, skipping exercise seeding.");
                return;
            }

            InputStream inputStream = resource.getInputStream();
            List<Map<String, Object>> exercises = objectMapper.readValue(
                    inputStream, new TypeReference<>() {});

            String sql = "INSERT INTO exercise (external_id, name, force_type, level, mechanic, equipment, " +
                    "primary_muscles, secondary_muscles, instructions, category, image_paths, " +
                    "is_custom, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, NOW())";

            jdbcTemplate.execute((Connection conn) -> {
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    int batchCount = 0;

                    for (Map<String, Object> ex : exercises) {
                        ps.setString(1, getString(ex, "id"));
                        ps.setString(2, getString(ex, "name"));
                        ps.setString(3, getString(ex, "force"));
                        ps.setString(4, getString(ex, "level"));
                        ps.setString(5, getString(ex, "mechanic"));
                        ps.setString(6, getString(ex, "equipment"));

                        ps.setArray(7, toVarcharArray(conn, ex, "primaryMuscles"));
                        ps.setArray(8, toVarcharArray(conn, ex, "secondaryMuscles"));
                        ps.setArray(9, toVarcharArray(conn, ex, "instructions"));
                        ps.setString(10, getString(ex, "category"));
                        ps.setArray(11, toVarcharArray(conn, ex, "images"));

                        ps.addBatch();
                        batchCount++;

                        if (batchCount % 100 == 0) {
                            ps.executeBatch();
                        }
                    }

                    if (batchCount % 100 != 0) {
                        ps.executeBatch();
                    }

                    log.info("Seeded {} exercises from exercises.json", batchCount);
                }
                return null;
            });

        } catch (Exception e) {
            log.error("Failed to seed exercises: {}", e.getMessage(), e);
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private Array toVarcharArray(Connection conn, Map<String, Object> map, String key) throws java.sql.SQLException {
        Object value = map.get(key);
        if (value instanceof List<?> list) {
            String[] arr = list.stream()
                    .map(Object::toString)
                    .toArray(String[]::new);
            return conn.createArrayOf("varchar", arr);
        }
        return conn.createArrayOf("varchar", new String[0]);
    }
}
