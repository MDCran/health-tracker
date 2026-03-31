package dev.zeroday.health.notifications.repository;

import dev.zeroday.health.notifications.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdAndDismissedFalseAndScheduledForBeforeOrderByScheduledForDesc(
            Long userId, Instant before);

    List<Notification> findByUserIdAndReadFalseAndDismissedFalseAndScheduledForBefore(
            Long userId, Instant before);

    long countByUserIdAndReadFalseAndDismissedFalseAndScheduledForBefore(
            Long userId, Instant before);
}
