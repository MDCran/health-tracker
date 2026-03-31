package dev.zeroday.health.integrations;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import dev.zeroday.health.user.UserProfile;
import dev.zeroday.health.user.UserProfileRepository;
import dev.zeroday.health.user.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class GoogleDriveService {

    private static final String APP_FOLDER_NAME = "HealthTracker";
    private static final String KEYS_FILE_NAME = "api-keys.enc";
    private static final NetHttpTransport HTTP_TRANSPORT = new NetHttpTransport();
    private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    @Value("${google.client-id:}")
    private String clientId;

    @Value("${google.client-secret:}")
    private String clientSecret;

    @Value("${google.redirect-uri:http://localhost:9147/api/v1/integrations/google/callback}")
    private String redirectUri;

    private final UserProfileRepository profileRepository;
    private final UserService userService;
    private final dev.zeroday.health.common.util.EncryptionService encryptionService;

    public GoogleDriveService(UserProfileRepository profileRepository, UserService userService,
                               dev.zeroday.health.common.util.EncryptionService encryptionService) {
        this.profileRepository = profileRepository;
        this.userService = userService;
        this.encryptionService = encryptionService;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    public String getAuthUrl(Long userId) {
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code"
                + "&scope=https://www.googleapis.com/auth/drive.file"
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=" + java.net.URLEncoder.encode(encryptionService.encrypt(String.valueOf(userId)), java.nio.charset.StandardCharsets.UTF_8);
    }

    public String getAuthUrl() {
        return getAuthUrl(userService.getCurrentUserId());
    }

    @Transactional
    public void handleCallback(String code, String encryptedState) throws IOException {
        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                HTTP_TRANSPORT, JSON_FACTORY, clientId, clientSecret, code, redirectUri)
                .execute();

        Long userId;
        try {
            String decrypted = encryptionService.decrypt(encryptedState);
            userId = Long.parseLong(decrypted.trim());
        } catch (Exception e) {
            userId = Long.parseLong(encryptedState.trim());
        }
        UserProfile profile = profileRepository.findByUserId(userId).orElseThrow();

        profile.setGoogleAccessToken(tokenResponse.getAccessToken());
        profile.setGoogleRefreshToken(tokenResponse.getRefreshToken());
        profile.setGoogleTokenExpiry(Instant.now().plusSeconds(tokenResponse.getExpiresInSeconds()));
        profile.setGoogleConnected(true);

        Drive drive = buildDriveClient(profile);
        String folderId = getOrCreateFolder(drive);
        profile.setGoogleDriveFolderId(folderId);

        profileRepository.save(profile);
    }

    @Transactional
    public void disconnect() {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId).orElseThrow();
        profile.setGoogleAccessToken(null);
        profile.setGoogleRefreshToken(null);
        profile.setGoogleTokenExpiry(null);
        profile.setGoogleDriveFolderId(null);
        profile.setGoogleConnected(false);
        profileRepository.save(profile);
    }

    @Transactional
    public void saveApiKeys(String openaiKey) throws IOException {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId).orElseThrow();

        if (!profile.isGoogleConnected()) {
            throw new IllegalStateException("Google Drive not connected. Connect Google Drive first.");
        }

        Drive drive = buildDriveClient(profile);
        String keysJson = "{\"openaiApiKey\":\"" + (openaiKey != null ? openaiKey : "") + "\"}";
        String encrypted = encryptionService.encrypt(keysJson);
        writeFileToDrive(drive, profile.getGoogleDriveFolderId(), KEYS_FILE_NAME, encrypted);
        profileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public String getApiKey(String keyName) {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null || !profile.isGoogleConnected()) return null;

        try {
            Drive drive = buildDriveClient(profile);
            String encrypted = readFileFromDrive(drive, profile.getGoogleDriveFolderId(), KEYS_FILE_NAME);
            if (encrypted == null) return null;

            String json = encryptionService.decrypt(encrypted);

            String searchKey = "\"" + keyName + "\":\"";
            int start = json.indexOf(searchKey);
            if (start < 0) return null;
            start += searchKey.length();
            int end = json.indexOf("\"", start);
            if (end < 0) return null;
            return json.substring(start, end);
        } catch (Exception e) {
            log.warn("Failed to read API key from Drive: {}", e.getMessage());
            return null;
        }
    }

    private Drive buildDriveClient(UserProfile profile) throws IOException {
        if (profile.getGoogleTokenExpiry() != null && Instant.now().isAfter(profile.getGoogleTokenExpiry())) {
            GoogleTokenResponse refreshed = new GoogleRefreshTokenRequest(
                    HTTP_TRANSPORT, JSON_FACTORY, profile.getGoogleRefreshToken(), clientId, clientSecret)
                    .execute();
            profile.setGoogleAccessToken(refreshed.getAccessToken());
            profile.setGoogleTokenExpiry(Instant.now().plusSeconds(refreshed.getExpiresInSeconds()));
            profileRepository.save(profile);
        }

        GoogleCredential credential = new GoogleCredential().setAccessToken(profile.getGoogleAccessToken());
        return new Drive.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName("HealthTracker")
                .build();
    }

    private String getOrCreateFolder(Drive drive) throws IOException {
        FileList result = drive.files().list()
                .setQ("name = '" + APP_FOLDER_NAME + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")
                .setSpaces("drive")
                .execute();

        if (result.getFiles() != null && !result.getFiles().isEmpty()) {
            return result.getFiles().get(0).getId();
        }

        File folder = new File()
                .setName(APP_FOLDER_NAME)
                .setMimeType("application/vnd.google-apps.folder");
        File created = drive.files().create(folder).setFields("id").execute();
        return created.getId();
    }

    private void writeFileToDrive(Drive drive, String folderId, String fileName, String content) throws IOException {
        FileList result = drive.files().list()
                .setQ("name = '" + fileName + "' and '" + folderId + "' in parents and trashed = false")
                .setSpaces("drive")
                .execute();

        ByteArrayContent mediaContent = new ByteArrayContent("application/json", content.getBytes(StandardCharsets.UTF_8));

        if (result.getFiles() != null && !result.getFiles().isEmpty()) {
            drive.files().update(result.getFiles().get(0).getId(), null, mediaContent).execute();
        } else {
            File file = new File()
                    .setName(fileName)
                    .setParents(Collections.singletonList(folderId));
            drive.files().create(file, mediaContent).execute();
        }
    }

    private String readFileFromDrive(Drive drive, String folderId, String fileName) throws IOException {
        FileList result = drive.files().list()
                .setQ("name = '" + fileName + "' and '" + folderId + "' in parents and trashed = false")
                .setSpaces("drive")
                .execute();

        if (result.getFiles() == null || result.getFiles().isEmpty()) return null;

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        drive.files().get(result.getFiles().get(0).getId()).executeMediaAndDownloadTo(baos);
        return baos.toString(StandardCharsets.UTF_8);
    }


    public String uploadBinaryFile(String folderId, String subfolder, String fileName,
                                    byte[] content, String mimeType) throws IOException {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId).orElseThrow();
        Drive drive = buildDriveClient(profile);

        String parentId = getOrCreateSubfolder(drive, folderId, subfolder);

        ByteArrayContent mediaContent = new ByteArrayContent(mimeType, content);
        File fileMetadata = new File()
                .setName(fileName)
                .setParents(Collections.singletonList(parentId));
        File created = drive.files().create(fileMetadata, mediaContent)
                .setFields("id")
                .execute();
        return created.getId();
    }


    public byte[] downloadBinaryFile(String fileId) throws IOException {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId).orElseThrow();
        Drive drive = buildDriveClient(profile);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        drive.files().get(fileId).executeMediaAndDownloadTo(baos);
        return baos.toByteArray();
    }


    public void deleteFile(String fileId) throws IOException {
        Long userId = userService.getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId).orElseThrow();
        Drive drive = buildDriveClient(profile);

        drive.files().delete(fileId).execute();
    }


    String getOrCreateSubfolder(Drive drive, String parentFolderId, String name) throws IOException {
        FileList result = drive.files().list()
                .setQ("name = '" + name + "' and '" + parentFolderId + "' in parents "
                        + "and mimeType = 'application/vnd.google-apps.folder' and trashed = false")
                .setSpaces("drive")
                .setFields("files(id)")
                .execute();

        if (result.getFiles() != null && !result.getFiles().isEmpty()) {
            return result.getFiles().get(0).getId();
        }

        File folder = new File()
                .setName(name)
                .setMimeType("application/vnd.google-apps.folder")
                .setParents(Collections.singletonList(parentFolderId));
        File created = drive.files().create(folder).setFields("id").execute();
        return created.getId();
    }

}
