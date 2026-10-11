package com.immersio.scenarios.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Runs {@link ScenarioService#seedScenarios()} at boot.
 *
 * <p>The seeder used to be an empty method with no caller, which left a fresh
 * install with an empty scenario catalogue. Seeding is idempotent — it no-ops
 * whenever any scenario already exists — so this is safe on every restart.
 */
@Component
public class ScenarioSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ScenarioSeedRunner.class);

    private final ScenarioService scenarioService;

    public ScenarioSeedRunner(ScenarioService scenarioService) {
        this.scenarioService = scenarioService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            scenarioService.seedScenarios();
        } catch (Exception e) {
            // A failed seed must never block startup — an admin can add
            // scenarios by hand, and an empty catalogue is better than a
            // container that refuses to come up.
            log.warn("Scenario seeding skipped: {}", e.getMessage());
        }
    }
}