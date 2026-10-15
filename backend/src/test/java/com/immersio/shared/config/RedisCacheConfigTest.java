package com.immersio.shared.config;

import java.time.Duration;

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
    void typeValidatorBlocksForeignTypes() {
        ObjectMapper mapper = RedisCacheConfig.cacheObjectMapper();

        // Simulate a hostile/corrupt cache entry naming an arbitrary class.
        String hostile = """
                ["java.lang.Runtime","calc",["id","id"]]
                """;

        assertThatThrownBy(() -> mapper.readValue(hostile, Object.class))
                .as("polymorphic typing must reject types outside com.immersio/java.util/java.time")
                .isNotNull();
    }
}