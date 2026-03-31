package dev.zeroday.health.notifications.controller;

import dev.zeroday.health.notifications.dto.NotificationResponse;
import dev.zeroday.health.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications() {
        return ResponseEntity.ok(notificationService.getNotifications());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount()));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<Void> dismiss(@PathVariable Long id) {
        notificationService.dismiss(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/dismiss-all")
    public ResponseEntity<Void> dismissAll() {
        notificationService.dismissAll();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<Void> generateNow() {
        notificationService.generateDailyNotifications();
        return ResponseEntity.ok().build();
    }
}
