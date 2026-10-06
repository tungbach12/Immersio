# syntax=docker/dockerfile:1
# ── Build stage runs on the CI host architecture (bytecode is arch-independent) ──
# so the multi-arch (amd64+arm64) push does NOT re-run Maven under QEMU emulation.
FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml ./
# Best-effort dependency warm-up layer for buildx cache; package re-fetches anything missing
RUN mvn -q -B dependency:go-offline || true
COPY src ./src
RUN mvn -q -B package -DskipTests

# ── Runtime stage: per-target-arch JRE ──
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --uid 1001 --create-home immersio \
    && mkdir -p /app/uploads \
    && chown -R immersio:immersio /app

COPY --from=build /build/target/*.jar /app/app.jar

USER immersio
EXPOSE 5249

# Container-aware heap (compose sets the memory limit; JVM uses ~55% of it)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=55 -Djava.security.egd=file:/dev/urandom"

# /api/health is permitAll in SecurityConfig — no auth needed for probes
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=6 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/5249 && printf "GET /api/health HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3 && grep -q "UP" <&3'

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
