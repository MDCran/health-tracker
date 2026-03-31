package dev.zeroday.health.notifications.dto;

import dev.zeroday.health.notifications.model.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private String notificationType;
    private String referenceType;
    private Long referenceId;
    private String linkUrl;
    private boolean read;
    private Instant scheduledFor;
    private Instant createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .notificationType(n.getNotificationType())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .linkUrl(n.getLinkUrl())
                .read(n.isRead())
                .scheduledFor(n.getScheduledFor())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
