package dev.zeroday.health.workout.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "workout_schedule")
@Getter
@Setter
@NoArgsConstructor
public class WorkoutSchedule extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private WorkoutTemplate template;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "days_of_week", columnDefinition = "integer[]")
    private List<Integer> daysOfWeek;

    @Column(name = "time_of_day")
    private LocalTime timeOfDay;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
