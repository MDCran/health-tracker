package dev.zeroday.health.integrations;

import dev.zeroday.health.user.UserProfile;
import dev.zeroday.health.user.UserProfileRepository;
import dev.zeroday.health.user.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/integrations")
@RequiredArgsConstructor
public class IntegrationsController {

    private final GoogleDriveService googleDriveService;
    private final UserService userService;
    private final UserProfileRepository profileRepository;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);
        boolean driveConnected = profile != null && profile.isGoogleConnected();
        boolean googleConfigured = googleDriveService.isConfigured();

        return ResponseEntity.ok(Map.of(
                "googleDrive", Map.of(
                        "configured", googleConfigured,
                        "connected", driveConnected,
                        "folderId", driveConnected && profile.getGoogleDriveFolderId() != null ? profile.getGoogleDriveFolderId() : ""
                )
        ));
    }

    @GetMapping("/google/auth-url")
    public ResponseEntity<Map<String, String>> getGoogleAuthUrl() {
        if (!googleDriveService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."));
        }
        return ResponseEntity.ok(Map.of("url", googleDriveService.getAuthUrl()));
    }

    @GetMapping("/google/callback")
    public ResponseEntity<String> googleCallback(@RequestParam String code, @RequestParam(required = false) String state) throws IOException {
        googleDriveService.handleCallback(code, state);
        return ResponseEntity.ok("<html><script>window.close(); window.opener && window.opener.postMessage('google-drive-connected', '*');</script><body>Connected! You can close this window.</body></html>");
    }

    @PostMapping("/google/disconnect")
    public ResponseEntity<Void> disconnectGoogle() {
        googleDriveService.disconnect();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/google/save-keys")
    public ResponseEntity<Void> saveKeys(@RequestBody SaveKeysRequest request) throws IOException {
        googleDriveService.saveApiKeys(request.getOpenaiApiKey());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/google/api-key")
    public ResponseEntity<Void> removeApiKey() throws IOException {
        googleDriveService.saveApiKeys("");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/google/api-key-status")
    public ResponseEntity<Map<String, Object>> getApiKeyStatus() {
        String key = googleDriveService.getApiKey("openaiApiKey");
        boolean hasKey = key != null && !key.isBlank();
        String masked = hasKey ? key.substring(0, Math.min(8, key.length())) + "****" + key.substring(Math.max(0, key.length() - 4)) : null;
        return ResponseEntity.ok(Map.of("hasKey", hasKey, "maskedKey", masked != null ? masked : ""));
    }

    @Data
    public static class SaveKeysRequest {
        private String openaiApiKey;
    }
}
