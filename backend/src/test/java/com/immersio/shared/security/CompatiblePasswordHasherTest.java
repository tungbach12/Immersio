package com.immersio.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards compatibility with password hashes written by the legacy ASP.NET
 * backend (Rfc2898DeriveBytes.Pbkdf2 — PBKDF2-HMAC-SHA512, 100k iterations,
 * 16-byte salt, 32-byte hash, stored as "base64(salt).base64(hash)").
 *
 * Vector: password "TestPassword123!" with salt 0x00..0x0f, generated with
 * hashlib.pbkdf2_hmac('sha512', pw, salt, 100000, dklen=32) — identical
 * derivation to .NET Rfc2898DeriveBytes with HashAlgorithmName.SHA512.
 */
class CompatiblePasswordHasherTest {

    private static final String LEGACY_HASH =
            "AAECAwQFBgcICQoLDA0ODw==.GmATlTS4zWuhNhVYm5JS/UVeAC64OarrbwHfpnDB9dM=";

    @Test
    void verifiesLegacyPbkdf2Hash() {
        assertTrue(CompatiblePasswordHasher.verify("TestPassword123!", LEGACY_HASH));
    }

    @Test
    void rejectsWrongPasswordAgainstLegacyHash() {
        assertFalse(CompatiblePasswordHasher.verify("wrong-password", LEGACY_HASH));
        assertFalse(CompatiblePasswordHasher.verify("", LEGACY_HASH));
        assertFalse(CompatiblePasswordHasher.verify(null, LEGACY_HASH));
    }

    @Test
    void detectsLegacyFormat() {
        assertTrue(CompatiblePasswordHasher.isLegacyFormat(LEGACY_HASH));
        assertFalse(CompatiblePasswordHasher.isLegacyFormat("$2a$10$abcdefghijklmnopqrstuv"));
        assertFalse(CompatiblePasswordHasher.isLegacyFormat("not-a-hash"));
        assertFalse(CompatiblePasswordHasher.isLegacyFormat(null));
    }

    @Test
    void wrapperMintsBcryptAndVerifiesBothFormats() {
        CompatiblePasswordEncoder encoder = new CompatiblePasswordEncoder();

        String minted = encoder.encode("TestPassword123!");
        assertTrue(minted.startsWith("$2"), "new hashes must be BCrypt");
        assertTrue(encoder.matches("TestPassword123!", minted));
        assertFalse(encoder.matches("wrong-password", minted));

        // legacy .NET hash must pass through the same bean
        assertTrue(encoder.matches("TestPassword123!", LEGACY_HASH));
        assertFalse(encoder.matches("wrong-password", LEGACY_HASH));
        assertFalse(encoder.matches("TestPassword123!", null));
    }

    @Test
    void wrapperStillVerifiesResetCodesHashedByBcrypt() {
        CompatiblePasswordEncoder encoder = new CompatiblePasswordEncoder();
        String codeHash = new BCryptPasswordEncoder().encode("123456");
        assertTrue(encoder.matches("123456", codeHash));
        assertFalse(encoder.matches("654321", codeHash));
    }
}
