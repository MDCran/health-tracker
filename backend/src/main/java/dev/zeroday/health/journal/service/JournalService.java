package dev.zeroday.health.journal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.common.exception.ResourceNotFoundException;
import dev.zeroday.health.journal.dto.JournalEntryRequest;
import dev.zeroday.health.journal.dto.JournalEntryResponse;
import dev.zeroday.health.journal.dto.RealmAverageResponse;
import dev.zeroday.health.journal.model.JournalEntry;
import dev.zeroday.health.journal.model.RealmRating;
import dev.zeroday.health.journal.repository.JournalEntryRepository;
import dev.zeroday.health.journal.repository.RealmRatingRepository;
import dev.zeroday.health.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository entryRepository;
    private final RealmRatingRepository realmRatingRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Transactional
    public JournalEntryResponse createOrUpdate(JournalEntryRequest request) {
        Long userId = userService.getCurrentUserId();

        JournalEntry entry = entryRepository.findByUserIdAndDate(userId, request.getDate())
                .orElseGet(() -> {
                    JournalEntry newEntry = new JournalEntry();
                    newEntry.setUserId(userId);
                    newEntry.setDate(request.getDate());
                    return newEntry;
                });

        entry.setReflection(request.getReflection());
        entry.setGratitude(request.getGratitude());
        entry.setOverallRating(request.getOverallRating());

        entry.getRealmRatings().clear();

        if (request.getRealmRatings() != null) {
            for (JournalEntryRequest.RealmRatingRequest ratingReq : request.getRealmRatings()) {
                RealmRating rating = new RealmRating();
                rating.setJournalEntry(entry);
                rating.setRealm(ratingReq.getRealm());
                rating.setRating(ratingReq.getRating());
                rating.setNotes(ratingReq.getNotes());

                if (ratingReq.getLikertResponses() != null) {
                    try {
                        rating.setLikertResponses(objectMapper.writeValueAsString(ratingReq.getLikertResponses()));
                    } catch (JsonProcessingException e) {
                        log.warn("Failed to serialize likert responses", e);
                    }
                }

                entry.getRealmRatings().add(rating);
            }
        }

        entry = entryRepository.save(entry);
        return JournalEntryResponse.from(entry);
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse getByDate(LocalDate date) {
        Long userId = userService.getCurrentUserId();
        JournalEntry entry = entryRepository.findByUserIdAndDate(userId, date)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", date.toString()));
        return JournalEntryResponse.from(entry);
    }

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> list(Pageable pageable) {
        Long userId = userService.getCurrentUserId();
        return entryRepository.findByUserIdOrderByDateDesc(userId, pageable)
                .map(JournalEntryResponse::from);
    }

    @Transactional(readOnly = true)
    public List<JournalEntryResponse> listBetween(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        return entryRepository.findByUserIdAndDateBetween(userId, from, to)
                .stream()
                .map(JournalEntryResponse::from)
                .toList();
    }

    @Transactional
    public void delete(LocalDate date) {
        Long userId = userService.getCurrentUserId();
        JournalEntry entry = entryRepository.findByUserIdAndDate(userId, date)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", date.toString()));
        entryRepository.delete(entry);
    }

    @Transactional(readOnly = true)
    public List<RealmAverageResponse> getRealmAverages(LocalDate from, LocalDate to) {
        Long userId = userService.getCurrentUserId();
        List<JournalEntry> entries = entryRepository.findByUserIdAndDateBetween(userId, from, to);

        List<RealmRating> allRatings = new ArrayList<>();
        for (JournalEntry entry : entries) {
            allRatings.addAll(entry.getRealmRatings());
        }

        Map<String, List<RealmRating>> byRealm = allRatings.stream()
                .collect(Collectors.groupingBy(RealmRating::getRealm));

        return byRealm.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream()
                            .mapToInt(RealmRating::getRating)
                            .average()
                            .orElse(0.0);
                    return RealmAverageResponse.builder()
                            .realm(e.getKey())
                            .averageRating(avg)
                            .count(e.getValue().size())
                            .build();
                })
                .toList();
    }
}
