package com.immersio.shared.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * PasswordEncoder that mints BCrypt hashes for everything we write, while
 * still verifying legacy PBKDF2-SHA512 hashes from the .NET era. Successful
 * logins against a legacy hash are re-hashed to BCrypt by AuthService
 * (upgrade-on-login), so the legacy branch disappears over time.
 */
public class CompatiblePasswordEncoder implements PasswordEncoder {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return bcrypt.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) return false;
        if (encodedPassword.startsWith("$2")) {
            return bcrypt.matches(rawPassword, encodedPassword);
        }
        return CompatiblePasswordHasher.verify(rawPassword.toString(), encodedPassword);
    }
}
