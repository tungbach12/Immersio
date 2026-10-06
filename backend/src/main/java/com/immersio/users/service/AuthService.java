package com.immersio.users.service;

import com.immersio.shared.email.EmailService;
import com.immersio.shared.email.EmailTemplates;
import com.immersio.shared.exception.ConflictException;
import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.shared.exception.UnauthorizedException;
import com.immersio.shared.security.JwtTokenProvider;
import com.immersio.users.api.dto.AuthResponse;
import com.immersio.users.api.dto.GoogleAuthRequest;
import com.immersio.users.api.dto.LoginRequest;
import com.immersio.users.api.dto.RegisterRequest;
import com.immersio.users.api.dto.ResetPasswordRequest;
import com.immersio.users.api.dto.UpdateSettingsRequest;
import com.immersio.users.domain.PasswordResetCode;
import com.immersio.users.domain.RefreshToken;
import com.immersio.users.domain.User;
import com.immersio.users.repository.PasswordResetCodeRepository;
import com.immersio.users.repository.RefreshTokenRepository;
import com.immersio.users.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import com.immersio.users.api.dto.UserDto;

@Service
public class AuthService {
    /** .NET parity: OtpExpiryMinutes = 10, MaxOtpAttempts = 5. */
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final long refreshTokenExpirationDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordResetCodeRepository passwordResetCodeRepository,
                       PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider,
                       EmailService emailService, GoogleTokenVerifier googleTokenVerifier,
                       @Value("${jwt.refresh-token-expiration-days:7}") long refreshTokenExpirationDays) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        String username = request.username().trim();
        if (userRepository.existsByEmail(email)) throw new ConflictException("Email is already registered.");
        if (userRepository.existsByUsername(username)) throw new ConflictException("Username is already taken.");
        User user = new User(username, email, passwordEncoder.encode(request.password()));
        if (userRepository.count() == 0) user.setRole("Admin"); // first user becomes admin (.NET parity)
        user = userRepository.save(user);
        emailService.sendSafe(user.getEmail(), EmailTemplates.welcome(user.getUsername()));
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalize(request.email()))
                .filter(candidate -> !candidate.isDeleted())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }
        if (!user.getPasswordHash().startsWith("$2")) {
            // Legacy .NET PBKDF2 hash verified — re-hash to BCrypt (upgrade-on-login)
            user.resetPassword(passwordEncoder.encode(request.password()));
            userRepository.save(user);
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleTokenVerifier.GoogleProfile profile = googleTokenVerifier.verify(request.idToken());
        String email = normalize(profile.email());
        User user = userRepository.findByEmail(email).filter(candidate -> !candidate.isDeleted()).orElse(null);
        if (user == null) {
            String usernameBase = email.split("@")[0];
            String username = usernameBase;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = usernameBase + counter++;
            }
            user = new User(username, email, "");
            if (userRepository.count() == 0) user.setRole("Admin"); // first user becomes admin (.NET parity)
            user = userRepository.save(user);
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken stored = refreshTokenRepository.findByToken(token)
                .filter(RefreshToken::isActive)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired refresh token."));
        User user = activeUser(stored.getUserId());
        stored.revoke();
        return issueTokens(user);
    }

    @Transactional
    public void revokeToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(tokenEntity -> {
            tokenEntity.revoke();
            refreshTokenRepository.save(tokenEntity);
        });
    }

    @Transactional
    public void forgotPassword(String email) {
        String normalized = normalize(email);
        User user = userRepository.findByEmail(normalized)
                .filter(candidate -> !candidate.isDeleted())
                .orElse(null);
        // .NET parity: never reveal whether the account exists (no enumeration)
        if (user == null) return;

        // Invalidate any previously issued, still-active codes for this email
        passwordResetCodeRepository.findAllByEmailAndUsedAtIsNullAndExpiresAtAfter(normalized, Instant.now())
                .forEach(PasswordResetCode::markUsed);

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        passwordResetCodeRepository.save(new PasswordResetCode(user.getEmail(), passwordEncoder.encode(code),
                Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES)));
        emailService.sendSafe(user.getEmail(), EmailTemplates.passwordResetOtp(code, OTP_EXPIRY_MINUTES));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = normalize(request.email());
        // .NET semantics: latest NOT-USED code (even if expired), then expiry, attempts, verify
        PasswordResetCode resetCode = passwordResetCodeRepository
                .findFirstByEmailAndUsedAtIsNullOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new UnauthorizedException("Mã OTP không hợp lệ hoặc đã hết hạn."));
        if (resetCode.isExpired()) {
            throw new UnauthorizedException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        if (resetCode.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            resetCode.markUsed();
            throw new UnauthorizedException("Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.");
        }
        if (!passwordEncoder.matches(request.code(), resetCode.getCodeHash())) {
            resetCode.registerAttempt();
            throw new UnauthorizedException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        User user = userRepository.findByEmail(email)
                .filter(candidate -> !candidate.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.resetPassword(passwordEncoder.encode(request.newPassword()));
        resetCode.markUsed();
        userRepository.save(user);
        passwordResetCodeRepository.save(resetCode);
    }

    @Transactional(readOnly = true)
    public UserDto getMe(UUID userId) { return UserDto.from(activeUser(userId)); }

    @Transactional
    public UserDto updateSettings(UUID userId, UpdateSettingsRequest request) {
        User user = activeUser(userId);
        user.updateSettings(value(request.notifEmail(), user.isNotifEmail()), value(request.notifPush(), user.isNotifPush()),
                value(request.notifStreak(), user.isNotifStreak()), value(request.notifTips(), user.isNotifTips()),
                value(request.isPublic(), user.isPublic()));
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public UserDto updateAvatar(UUID userId, String url) {
        User user = activeUser(userId);
        user.updateProfilePicture(url);
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        User user = activeUser(userId);
        user.anonymize();
        userRepository.save(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = UUID.randomUUID() + "." + UUID.randomUUID();
        refreshTokenRepository.save(new RefreshToken(refreshToken, user.getId(),
                Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS)));
        return new AuthResponse(accessToken, refreshToken, UserDto.from(user));
    }

    private User activeUser(UUID userId) {
        return userRepository.findById(userId).filter(user -> !user.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private static boolean value(Boolean requested, boolean current) { return requested == null ? current : requested; }
    private static String normalize(String value) { return value.trim().toLowerCase(java.util.Locale.ROOT); }
}
