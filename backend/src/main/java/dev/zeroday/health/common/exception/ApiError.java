package dev.zeroday.health.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class ApiError {
    private final int status;
    private final String message;
    private final Instant timestamp;

    public ApiError(int status, String message) {
        this.status = status;
        this.message = message;
        this.timestamp = Instant.now();
    }
}
