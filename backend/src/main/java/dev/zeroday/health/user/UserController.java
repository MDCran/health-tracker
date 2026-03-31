package dev.zeroday.health.user;

import dev.zeroday.health.user.dto.UserProfileRequest;
import dev.zeroday.health.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserProfileRepository profileRepository;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(userService.getCurrentProfile());
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> updateProfile(@RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        User user = userService.getCurrentUser();
        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        String ext = ".jpg";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String fileName = "avatar-" + user.getId() + "-" + UUID.randomUUID().toString().substring(0, 8) + ext;

        try {
            Path avatarDir = Paths.get(uploadDir, "avatars");
            Files.createDirectories(avatarDir);
            Path target = avatarDir.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            profile.setAvatarPath(target.toString());
            profileRepository.save(profile);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save avatar", e);
        }

        return ResponseEntity.ok(userService.getCurrentProfile());
    }

    @GetMapping("/avatar")
    public ResponseEntity<byte[]> getAvatar() {
        User user = userService.getCurrentUser();
        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (profile.getAvatarPath() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] bytes = Files.readAllBytes(Paths.get(profile.getAvatarPath()));
            String path = profile.getAvatarPath().toLowerCase();
            String contentType = path.endsWith(".png") ? "image/png" : "image/jpeg";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/sidebar-config")
    public ResponseEntity<String> getSidebarConfig() {
        User user = userService.getCurrentUser();
        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        String config = profile.getSidebarConfig();
        return ResponseEntity.ok(config != null ? config : "[]");
    }

    @PutMapping("/sidebar-config")
    public ResponseEntity<String> updateSidebarConfig(@RequestBody String config) {
        User user = userService.getCurrentUser();
        UserProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        profile.setSidebarConfig(config);
        profileRepository.save(profile);
        return ResponseEntity.ok(config);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount() {
        userService.deleteCurrentAccount();
        return ResponseEntity.noContent().build();
    }
}
