# Real Redis Integration Plan for Immersio

> **Goal:** Deploy a real Redis instance on VPS2 and integrate Spring Boot 4 Data Redis caching into Immersio backend to eliminate repeated 3–15s LLM dictionary calls, reduce DB load for scenarios, and provide fault-tolerant cache resilience.

**Architecture:** 
- Infrastructure: Lightweight `redis:7-alpine` container running inside `docker-compose.yml` on VPS2 with strict memory caps (64MB cgroup limit, 48MB maxmemory LRU).
- Application: `spring-boot-starter-data-redis` with Jackson JSON serialization for human-readable Redis keys/values.
- Resilience: Custom `CacheErrorHandler` ensuring cache failures gracefully bypass to DB/LLM instead of failing requests.
- Caching Targets:
  1. `dictionary`: Key `${targetLanguage}:${normalizedWord}`, TTL 7 days.
  2. `scenarios`: Key `'all'`, TTL 1 hour with `@CacheEvict` on scenario mutation.

**Tech Stack:** Redis 7 Alpine, Spring Boot 4.1.0, Spring Data Redis (Lettuce), Jackson, Docker Compose.

---

### Task 1: Update VPS2 Docker Compose & CI Deployment Configuration

**Objective:** Define the `immersio-redis` container with strict memory limits and wire it to `immersio-api`.

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify on VPS2: `/opt/immersio/docker-compose.yml`

**Specification:**
```yaml
  redis:
    image: redis:7-alpine
    container_name: immersio-redis
    restart: always
    command: redis-server --maxmemory 48mb --maxmemory-policy allkeys-lru --appendonly yes
    deploy:
      resources:
        limits:
          memory: "67108864"
        reservations:
          memory: "33554432"
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redisdata:/data
    networks:
      - immersio-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
```
And on `immersio-api`:
- Environment:
  `SPRING_DATA_REDIS_HOST: redis`
  `SPRING_DATA_REDIS_PORT: 6379`
- `depends_on`:
  `redis`:
    `condition: service_healthy`
- Add volume `redisdata` to top-level volumes.

---

### Task 2: Add Redis Starter & Application Properties

**Objective:** Add `spring-boot-starter-data-redis` to Maven and configure Redis connection properties in `application.yml`.

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.yml`

**Step 1: Add dependency to `backend/pom.xml`**
```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
```

**Step 2: Add configuration to `backend/src/main/resources/application.yml`**
```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 3600000 # 1 hour default
      cache-null-values: false
  data:
    redis:
      host: ${SPRING_DATA_REDIS_HOST:localhost}
      port: ${SPRING_DATA_REDIS_PORT:6379}
      timeout: 2000ms
```

---

### Task 3: Implement Redis Cache Configuration & Fault-Tolerant Error Handler

**Objective:** Configure `RedisCacheManager` with Jackson JSON serialization and a `CacheErrorHandler` that prevents Redis outages from breaking user requests.

**Files:**
- Create: `backend/src/main/java/com/immersio/shared/config/RedisCacheConfig.java`
- Create: `backend/src/main/java/com/immersio/shared/config/CustomCacheErrorHandler.java`

**Specification:**
1. `RedisCacheConfig`:
   - `@Configuration` + `@EnableCaching`
   - Cache configurations:
     - Default: Jackson JSON serializer, 1h TTL, disable caching nulls.
     - `dictionary`: 7 days TTL.
     - `scenarios`: 1 hour TTL.
2. `CustomCacheErrorHandler` implementing `org.springframework.cache.interceptor.CacheErrorHandler`:
   - `handleCacheGetError`: logs warning `"[CACHE-ERROR] Redis GET failed, falling back to service: {}"`, does not rethrow.
   - `handleCachePutError`: logs warning, does not rethrow.
   - `handleCacheEvictError`: logs warning, does not rethrow.
   - `handleCacheClearError`: logs warning, does not rethrow.

---

### Task 4: Unit Test for Cache Resilience & Serialization (TDD)

**Objective:** Verify that Redis serialization and error handling behave as expected without requiring a live Redis server during standard test execution.

**Files:**
- Create: `backend/src/test/java/com/immersio/shared/config/CustomCacheErrorHandlerTest.java`

**Step 1: Write test verifying error handler swallows exceptions**
```java
@Test
void handleCacheGetErrorDoesNotThrow() {
    CustomCacheErrorHandler handler = new CustomCacheErrorHandler();
    assertThatCode(() -> handler.handleCacheGetError(new RuntimeException("Redis connection refused"), null, "key"))
        .doesNotThrowAnyException();
}
```

**Step 2: Run test and verify pass**
Run: `./mvnw test -Dtest=CustomCacheErrorHandlerTest`

---

### Task 5: Annotate Services with `@Cacheable` and `@CacheEvict`

**Objective:** Wire caching into `PronunciationService` (dictionary lookup) and `ScenarioService` (scenarios catalog).

**Files:**
- Modify: `backend/src/main/java/com/immersio/practice/service/PronunciationService.java`
- Modify: `backend/src/main/java/com/immersio/scenarios/service/ScenarioService.java`

**Changes:**
1. `PronunciationService.java`:
   ```java
   @Cacheable(value = "dictionary", key = "#request.targetLanguage() + ':' + #request.word().toLowerCase().trim()", unless = "#result == null")
   public DictionaryEntryDto lookupWord(DictionaryLookupRequest request) { ... }
   ```
2. `ScenarioService.java`:
   ```java
   @Cacheable(value = "scenarios", key = "'all'")
   public List<ScenarioDto> getScenarios() { ... }

   @CacheEvict(value = "scenarios", allEntries = true)
   public ScenarioDto createScenario(...) { ... }

   @CacheEvict(value = "scenarios", allEntries = true)
   public ScenarioDto updateScenario(...) { ... }

   @CacheEvict(value = "scenarios", allEntries = true)
   public void deleteScenario(...) { ... }
   ```

---

### Task 6: Full Local Verification

**Objective:** Run the full Maven test suite to ensure Modulith boundaries, serialization, and existing 192 tests pass.

**Commands:**
```bash
cd backend
./mvnw clean test
```
Expected: `Tests run: 193+, Failures: 0, Errors: 0, Skipped: 0`

---

### Task 7: Production Deployment & Verification on VPS2

**Objective:** Deploy to VPS2, provision `immersio-redis` container, restart `immersio-api`, and measure live latency reduction.

**Verification Steps:**
1. Start `immersio-redis` container on VPS2.
2. Verify Redis health: `docker exec immersio-redis redis-cli ping` -> `PONG`.
3. Push to `main` and trigger GitHub Actions build.
4. Test live `/api/practice/dictionary-lookup`:
   - 1st query for `"wanderlust"`: Latency ~3-10s (Cache miss, calls 9Router).
   - 2nd query for `"wanderlust"`: Latency < 5ms (Cache hit from Redis!).
5. Verify key in Redis:
   `docker exec immersio-redis redis-cli keys 'dictionary*'`
