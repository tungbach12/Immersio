package com.immersio.shared.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;

/**
 * Regression tests for the cache fault-tolerance contract.
 *
 * <p>Redis is a cache, not a dependency. If it is slow, restarting, or full, the
 * request must still succeed by falling through to the database/LLM path. Spring's
 * default {@code CacheErrorHandler} rethrows, which turns a Redis blip into a 500
 * for the user — these tests pin the opposite behaviour.
 */
@DisplayName("CustomCacheErrorHandler resilience")
class CustomCacheErrorHandlerTest {

    private final CacheErrorHandler handler = new CustomCacheErrorHandler();
    private final Cache cache = mock(Cache.class);
    private final RuntimeException failure = new RuntimeException("Unable to connect to Redis");

    @Test
    @DisplayName("a Redis GET failure does not propagate to the caller")
    void getFailureDoesNotPropagate() {
        assertThatCode(() -> handler.handleCacheGetError(failure, cache, "dictionary::journey"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a Redis PUT failure does not propagate to the caller")
    void putFailureDoesNotPropagate() {
        assertThatCode(() -> handler.handleCachePutError(failure, cache, "scenarios::all", "value"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a Redis EVICT failure does not propagate to the caller")
    void evictFailureDoesNotPropagate() {
        assertThatCode(() -> handler.handleCacheEvictError(failure, cache, "scenarios::all"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a Redis CLEAR failure does not propagate to the caller")
    void clearFailureDoesNotPropagate() {
        assertThatCode(() -> handler.handleCacheClearError(failure, cache))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a null cache is tolerated (evict/clear can fire without one)")
    void nullCacheIsTolerated() {
        assertThatCode(() -> handler.handleCacheGetError(failure, null, "key")).doesNotThrowAnyException();
        assertThatCode(() -> handler.handleCacheClearError(failure, null)).doesNotThrowAnyException();
    }
}