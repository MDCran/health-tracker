package dev.zeroday.health.metrics.service;

import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.metrics.dto.*;
import dev.zeroday.health.metrics.model.BodyMetric;
import dev.zeroday.health.metrics.model.MetricType;
import dev.zeroday.health.metrics.repository.BodyMetricRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BodyMetricService {

    private final BodyMetricRepository metricRepository;
    private final UserService userService;

    @Transactional
    public BodyMetricResponse create(BodyMetricRequest request) {
        Long userId = userService.getCurrentUserId();

        BodyMetric metric = new BodyMetric();
        metric.setUserId(userId);
        metric.setMetricType(request.getMetricType());
        metric.setCustomName(request.getCustomName());
        metric.setValue(request.getValue());
        metric.setUnit(request.getUnit());
        metric.setMeasuredAt(request.getMeasuredAt() != null ? request.getMeasuredAt() : Instant.now());
        metric.setNotes(request.getNotes());

        metric = metricRepository.save(metric);
        return BodyMetricResponse.from(metric);
    }

    @Transactional
    public BodyMetricResponse update(Long id, BodyMetricRequest request) {
        BodyMetric metric = metricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BodyMetric", id));

        if (request.getMetricType() != null) metric.setMetricType(request.getMetricType());
        if (request.getCustomName() != null) metric.setCustomName(request.getCustomName());
        if (request.getValue() != null) metric.setValue(request.getValue());
        if (request.getUnit() != null) metric.setUnit(request.getUnit());
        if (request.getMeasuredAt() != null) metric.setMeasuredAt(request.getMeasuredAt());
        if (request.getNotes() != null) metric.setNotes(request.getNotes());

        metric = metricRepository.save(metric);
        return BodyMetricResponse.from(metric);
    }

    @Transactional
    public void delete(Long id) {
        BodyMetric metric = metricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BodyMetric", id));
        metricRepository.delete(metric);
    }

    @Transactional(readOnly = true)
    public Page<BodyMetricResponse> list(String type, Instant from, Instant to, Pageable pageable) {
        Long userId = userService.getCurrentUserId();

        if (type != null) {
            return metricRepository
                    .findByUserIdAndMetricTypeOrderByMeasuredAtDesc(userId, type, pageable)
                    .map(BodyMetricResponse::from);
        }

        return metricRepository.findByUserIdOrderByMeasuredAtDesc(userId, pageable)
                .map(BodyMetricResponse::from);
    }

    @Transactional(readOnly = true)
    public List<BodyMetricResponse> listByType(String type, Instant from, Instant to) {
        Long userId = userService.getCurrentUserId();

        if (from != null && to != null) {
            return metricRepository.findByUserIdAndMetricTypeAndMeasuredAtBetween(userId, type, from, to)
                    .stream()
                    .map(BodyMetricResponse::from)
                    .toList();
        }

        return metricRepository.findByUserIdAndMetricTypeOrderByMeasuredAtDesc(userId, type)
                .stream()
                .map(BodyMetricResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public LatestMetricsResponse getLatest() {
        Long userId = userService.getCurrentUserId();
        Map<String, LatestMetricsResponse.LatestValue> latestMap = new LinkedHashMap<>();

        for (MetricType type : MetricType.values()) {
            metricRepository.findTopByUserIdAndMetricTypeOrderByMeasuredAtDesc(userId, type.name())
                    .ifPresent(metric -> latestMap.put(type.name(),
                            LatestMetricsResponse.LatestValue.builder()
                                    .value(metric.getValue())
                                    .unit(metric.getUnit())
                                    .measuredAt(metric.getMeasuredAt())
                                    .build()));
        }

        return LatestMetricsResponse.builder().metrics(latestMap).build();
    }

    @Transactional(readOnly = true)
    public MetricTrendResponse getTrends(String type, Instant from, Instant to) {
        Long userId = userService.getCurrentUserId();

        List<BodyMetric> metrics;
        if (from != null && to != null) {
            metrics = metricRepository.findByUserIdAndMetricTypeAndMeasuredAtBetween(userId, type, from, to);
        } else {
            metrics = metricRepository.findByUserIdAndMetricTypeOrderByMeasuredAtDesc(userId, type);
        }

        List<MetricTrendResponse.DataPoint> dataPoints = metrics.stream()
                .sorted(Comparator.comparing(BodyMetric::getMeasuredAt))
                .map(m -> MetricTrendResponse.DataPoint.builder()
                        .date(m.getMeasuredAt())
                        .value(m.getValue())
                        .build())
                .collect(Collectors.toList());

        return MetricTrendResponse.builder()
                .metricType(type)
                .dataPoints(dataPoints)
                .build();
    }
}
