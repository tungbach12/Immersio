package com.immersio.shared.security;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

/**
 * Verifies password hashes produced by the legacy ASP.NET backend so existing
 * users keep their accounts after the production switch to Java.
 *
 * .NET format (Immersio.Infrastructure/Services/PasswordHasher.cs):
 *   Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, SHA512, 32)
 *   stored as "base64(16-byte salt).base64(32-byte hash)"
 *
 * Pure JDK — no Spring imports — so it stays unit-testable in isolation.
 */
public final class CompatiblePasswordHasher {

    private static final int ITERATIONS = 100_000;
    private static final String ALGORITHM = "PBKDF2WithHmacSHA512";

    private CompatiblePasswordHasher() {}

    /** True when the stored value looks like a legacy "salt.hash" PBKDF2 string. */
    public static boolean isLegacyFormat(String stored) {
        if (stored == null || stored.startsWith("$")) return false;
        String[] parts = stored.split("\\.", -1);
        return parts.length == 2 && isBase64(parts[0]) && isBase64(parts[1]);
    }

    /** Constant-time verification of a legacy PBKDF2-SHA512 hash. */
    public static boolean verify(String password, String stored) {
        if (password == null || !isLegacyFormat(stored)) return false;
        String[] parts = stored.split("\\.", 2);
        try {
            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] expected = Base64.getDecoder().decode(parts[1]);
            byte[] actual = derive(password, salt, expected.length * 8);
            return MessageDigest.isEqual(expected, actual);
        } catch (IllegalArgumentException | InvalidKeySpecException ex) {
            return false;
        }
    }

    private static byte[] derive(String password, byte[] salt, int bits) throws InvalidKeySpecException {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, bits);
        try {
            return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("PBKDF2WithHmacSHA512 unavailable", ex);
        } finally {
            spec.clearPassword();
        }
    }

    private static boolean isBase64(String value) {
        if (value.isEmpty()) return false;
        try {
            Base64.getDecoder().decode(value);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
