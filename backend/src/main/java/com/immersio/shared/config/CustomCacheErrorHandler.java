package com.immersio.shared.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/**
 * Keeps a Redis outage from becoming a user-facing error.
 *
 * <p>Spring's default {@code CacheErrorHandler} rethrows whatever Redis throws, so a
 * slow, restarting, or memory-full Redis turns a cacheable read into an HTTP 500.
 * Redis here is purely an optimisation — dictionary lookups and the scenarios
 * catalog both have a correct uncached path — so every failure is logged at WARN
 * and swallowed, letting the call fall through to the database/LLM.
 */
public class CustomCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(RuntimeException ex, Cache cache, Object key) {
        log.warn("[CACHE-ERROR] Redis GET failed on cache '{}' key '{}' — serving uncached: {}",
                name(cache), key, ex.toString());
    }

    @Override
    public void handleCachePutError(RuntimeException ex, Cache cache, Object key, Object value) {
        log.warn("[CACHE-ERROR] Redis PUT failed on cache '{}' key '{}' — value not cached: {}",
                name(cache), key, ex.toString());
    }

    @Override
    public void handleCacheEvictError(RuntimeException ex, Cache cache, Object key) {
        log.warn("[CACHE-ERROR] Redis EVICT failed on cache '{}' key '{}' — stale entry may persist: {}",
                name(cache), key, ex.toString());
    }

    @Override
    public void handleCacheClearError(RuntimeException ex, Cache cache) {
        log.warn("[CACHE-ERROR] Redis CLEAR failed on cache '{}' — stale entries may persist: {}",
                name(cache), ex.toString());
    }

    private static String name(Cache cache) {
        return cache == null ? "<no-cache>" : cache.getName();
    }
}