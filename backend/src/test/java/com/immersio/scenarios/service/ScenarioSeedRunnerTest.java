package com.immersio.scenarios.service;

import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * The seeder only matters if it actually runs at boot, and a failure in it must
 * never take the container down with it.
 */
class ScenarioSeedRunnerTest {

    private final ScenarioService scenarioService = mock(ScenarioService.class);

    @Test
    void seedsOnStartup() {
        new ScenarioSeedRunner(scenarioService).run(null);

        verify(scenarioService).seedScenarios();
    }

    @Test
    void swallowsSeedFailuresSoStartupContinues() {
        doThrow(new IllegalStateException("db down")).when(scenarioService).seedScenarios();

        // must not propagate
        new ScenarioSeedRunner(scenarioService).run(null);
    }
}