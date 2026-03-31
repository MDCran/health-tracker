package dev.zeroday.health.search;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<SearchResponse> search(
            @RequestParam("q") String query,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.ok(SearchResponse.builder()
                    .results(java.util.List.of())
                    .totalCount(0)
                    .build());
        }
        return ResponseEntity.ok(searchService.search(query.trim(), limit));
    }
}
