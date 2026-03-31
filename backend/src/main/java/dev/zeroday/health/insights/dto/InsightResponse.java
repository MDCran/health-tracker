package dev.zeroday.health.insights.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class InsightResponse {
    private List<Insight> insights;
    private List<Correlation> correlations;
    private String overallScore;
    private String overallSummary;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Insight {
        private String id;
        private String category;
        private String severity;
        private String icon;
        private String title;
        private String message;
        private String actionLabel;
        private String actionLink;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Correlation {
        private String id;
        private String title;
        private String description;
        private String trend;
        private String sentiment;
        private List<String> modules;
    }
}
