package dev.zeroday.health.therapeutics.model;

import dev.zeroday.health.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "therapeutic_schedule")
@Getter
@Setter
@NoArgsConstructor
public class TherapeuticSchedule extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "therapeutic_type", nullable = false, length = 50)
    private String therapeuticType;

    @Column(name = "therapeutic_id", nullable = false)
    private Long therapeuticId;

    @Column(name = "schedule_type", length = 50)
    private String scheduleType;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "days_of_week", columnDefinition = "integer[]")
    private List<Integer> daysOfWeek;

    @Column(name = "interval_days")
    private Integer intervalDays;

    @Column(name = "time_of_day")
    private LocalTime timeOfDay;

    @Column(name = "dosage_override", precision = 10, scale = 4)
    private BigDecimal dosageOverride;

    @Column(name = "dosage_unit", length = 50)
    private String dosageUnit;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
