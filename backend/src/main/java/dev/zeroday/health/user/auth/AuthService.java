package dev.zeroday.health.user.auth;

import dev.zeroday.health.user.User;
import dev.zeroday.health.user.UserProfile;
import dev.zeroday.health.user.UserProfileRepository;
import dev.zeroday.health.user.UserRepository;
import dev.zeroday.health.user.dto.AuthResponse;
import dev.zeroday.health.user.dto.LoginRequest;
import dev.zeroday.health.user.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }

        User user = new User(request.getUsername(), passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profileRepository.save(profile);

        String token = tokenProvider.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, user.getId(), user.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, user.getId(), user.getUsername());
    }
}
