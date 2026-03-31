package dev.zeroday.health.workout.repository;

import dev.zeroday.health.workout.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    List<Exercise> findByNameContainingIgnoreCase(String name);

    @Query(value = "SELECT * FROM exercise e " +
            "WHERE e.name % :query " +
            "ORDER BY similarity(e.name, :query) DESC " +
            "LIMIT 20", nativeQuery = true)
    List<Exercise> search(@Param("query") String query);

    @Query(value = "SELECT e.* FROM exercise e " +
            "LEFT JOIN workout_exercise we ON we.exercise_id = e.id " +
            "LEFT JOIN workout_session ws ON ws.id = we.session_id AND ws.user_id = :userId " +
            "WHERE e.name ILIKE '%' || :query || '%' " +
            "GROUP BY e.id " +
            "ORDER BY COUNT(we.id) DESC, e.name " +
            "LIMIT :limit", nativeQuery = true)
    List<Exercise> autocomplete(@Param("userId") Long userId,
                                @Param("query") String query,
                                @Param("limit") int limit);

    long countByIsCustomFalse();

    Optional<Exercise> findBySourceAndSourceId(String source, String sourceId);

    long countBySource(String source);
}
