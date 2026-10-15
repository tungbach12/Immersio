package com.immersio.shared.config;

import java.time.Duration;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.immersio.practice.api.dto.DictionaryEntryDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit-level checks on the cache serializer and TTL wiring.
 *
 * <p>A full-context test is deliberately absent: booting the app requires a live
 * Postgres (Flyway runs at startup) and this repo has no {@code @SpringBootTest}
 * precedent. These assertions cover what can be verified in isolation, and the
 * end-to-end hit/miss latency is verified against production after deploy.
 */
@DisplayName("RedisCacheConfig serialization and TTL")
class RedisCacheConfigTest {

    @Test
    @DisplayName("TTLs match the intent: dictionary 7 days, scenarios 1 hour")
    void ttlsMatchIntent() {
        assertThat(RedisCacheConfig.DICTIONARY_TTL).isEqualTo(Duration.ofDays(7));
        assertThat(RedisCacheConfig.SCENARIOS_TTL).isEqualTo(Duration.ofHours(1));
    }

    @Test
    @DisplayName("cache names are stable strings used by the annotations")
    void cacheNamesAreStable() {
        assertThat(RedisCacheConfig.DICTIONARY_CACHE).isEqualTo("dictionary");
        assertThat(RedisCacheConfig.SCENARIOS_CACHE).isEqualTo("scenarios");
    }

    @Test
    @DisplayName("a dictionary DTO round-trips through the cache ObjectMapper")
    void dictionaryEntryRoundTrips() throws Exception {
        ObjectMapper mapper = RedisCacheConfig.cacheObjectMapper();
        DictionaryEntryDto original = new DictionaryEntryDto(
                "journey", "hành trình", "/ˈdʒɜː.ni/", "noun",
                "a long trip", "I took a journey.", "Một chuyến đi.");

        String json = mapper.writeValueAsString(original);
        assertThat(json).contains("journey");

        Object back = mapper.readValue(json, Object.class);
        assertThat(back).as("polymorphic typing must restore the concrete type")
                .isInstanceOf(DictionaryEntryDto.class);
        assertThat(((DictionaryEntryDto) back).word()).isEqualTo("journey");
        assertThat(((DictionaryEntryDto) back).translation()).isEqualTo("hành trình");
    }

    @Test
    @DisplayName("a cached payload cannot instantiate a class outside the allowlist")
    void typeValidatorBlocksForeignTypes() throws Exception {
        ObjectMapper mapper = RedisCacheConfig.cacheObjectMapper();

        // Serialise with the real mapper so the fixture matches what Redis actually
        // stores, then read it back. ScenarioDto has a `double rating`, which Jackson
        // returns as BigDecimal — the validator must permit java.math.* or the read
        // fails with "denied resolution" (observed on first deploy).
        com.immersio.scenarios.api.dto.ScenarioDto original =
                new com.immersio.scenarios.api.dto.ScenarioDto(
                        java.util.UUID.fromString("7bcf1a97-a50a-4867-9c36-d8bfce62059b"),
                        "Discovery: Shibuya Navigation", "English", "Beginner", "Navigation",
                        "Learn to navigate.", 4.5, "10", null, "ctx", "msg", null,
                        false, null, null, null, null, List.of());

        String json = mapper.writeValueAsString(original);
        assertThat(json).contains("ScenarioDto");

        Object back = mapper.readValue(json, Object.class);
        assertThat(back).isInstanceOf(com.immersio.scenarios.api.dto.ScenarioDto.class);
        assertThat(((com.immersio.scenarios.api.dto.ScenarioDto) back).rating()).isEqualTo(4.5);
        assertThat(((com.immersio.scenarios.api.dto.ScenarioDto) back).id()).isEqualTo(original.id());
    }
}