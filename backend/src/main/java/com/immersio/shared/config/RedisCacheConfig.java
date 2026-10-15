package com.immersio.shared.config;

import java.time.Duration;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.cache.annotation.CachingConfigurer;

/**
 * Redis cache configuration.
 *
 * <p>Keys are plain strings so {@code redis-cli keys 'dictionary*'} stays readable while
 * debugging; values are JSON so entries are inspectable without a Java class on hand.
 *
 * <p>The fault tolerance is wired through {@link CachingConfigurer#errorHandler()}: Spring
 * Boot 4 dropped {@code RedisCacheManagerBuilderCustomizer}, and neither
 * {@code RedisCacheManagerBuilder} nor {@code RedisCacheConfiguration} exposes an error
 * handler — the interceptor is the only seam that accepts one. That matters because the
 * default handler rethrows, which would turn a Redis blip into a 500 for the user.
 *
 * <p>The {@link CacheManager} is declared explicitly rather than customised so its
 * serializers and per-cache TTLs are obvious at a glance.
 */
@Configuration
@EnableCaching
public class RedisCacheConfig implements CachingConfigurer {

    /** Dictionary lookups are stable facts about a word in a language. */
    static final Duration DICTIONARY_TTL = Duration.ofDays(7);

    /** The scenarios catalog changes only when an admin edits a scenario. */
    static final Duration SCENARIOS_TTL = Duration.ofHours(1);

    /** Cache names are public so the annotated services can reference them as literals. */
    public static final String DICTIONARY_CACHE = "dictionary";
    public static final String SCENARIOS_CACHE = "scenarios";

    /**
     * Polymorphic JSON so cached DTOs round-trip to their concrete type. The validator
     * limits type ids to the app's own packages plus JDK collections/time, so a cached
     * payload can never instantiate an arbitrary class.
     */
    static ObjectMapper cacheObjectMapper() {
        BasicPolymorphicTypeValidator validator = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.immersio.")
                .allowIfSubType("java.util.")
                .allowIfSubType("java.time.")
                .build();
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY)
                // EVERYTHING, not NON_FINAL: the cached DTOs are Java records, which are
                // final and therefore get no type id under NON_FINAL — every cache read
                // would fail with "missing type id property '@class'".
                .activateDefaultTyping(validator, ObjectMapper.DefaultTyping.EVERYTHING, JsonTypeInfo.As.PROPERTY);
    }

    private static RedisCacheConfiguration base(Duration ttl) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(ttl)
                // Never cache nulls: a miss must reach the LLM/DB, not be memoised.
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer(cacheObjectMapper())));
    }

    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(base(SCENARIOS_TTL))
                .withCacheConfiguration(DICTIONARY_CACHE, base(DICTIONARY_TTL))
                .withCacheConfiguration(SCENARIOS_CACHE, base(SCENARIOS_TTL))
                .transactionAware()
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CustomCacheErrorHandler();
    }
}