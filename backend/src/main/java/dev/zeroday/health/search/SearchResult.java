package dev.zeroday.health.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SearchResult {
    private String category;
    private Long id;
    private String title;
    private String subtitle;
    private String url;
    private String icon;
}
