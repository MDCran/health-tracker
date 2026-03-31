package dev.zeroday.health.workout.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_template")
@Getter
@Setter
@NoArgsConstructor
public class WorkoutTemplate extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(length = 7)
    private String color;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("exerciseOrder ASC")
    private List<WorkoutTemplateExercise> exercises = new ArrayList<>();
}
