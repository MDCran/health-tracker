package dev.zeroday.health.habits.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "habit")
@Getter
@Setter
@NoArgsConstructor
public class Habit extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false, length = 50)
    private String frequency;

    @Column(name = "target_count")
    private Integer targetCount;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "days_of_week", columnDefinition = "integer[]")
    private List<Integer> daysOfWeek;

    @Column(length = 20)
    private String color;

    @Column(length = 50)
    private String icon;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "habit_type", nullable = false, length = 10)
    private String habitType = "GOOD";

    @Column(name = "target_days", nullable = false)
    private int targetDays = 66;

    @Column(length = 50)
    private String category;

    @Column(columnDefinition = "text")
    private String cue;

    @Column(columnDefinition = "text")
    private String routine;

    @Column(columnDefinition = "text")
    private String reward;

    @Column(name = "stack_after_habit_id")
    private Long stackAfterHabitId;

    @Column(length = 20)
    private String difficulty = "MEDIUM";

    private Integer priority;

    @Column(name = "reminder_time")
    private LocalTime reminderTime;
}
