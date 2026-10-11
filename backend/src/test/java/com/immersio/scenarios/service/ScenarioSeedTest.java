package com.immersio.scenarios.service;

import com.immersio.scenarios.domain.Scenario;
import com.immersio.scenarios.repository.ScenarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@code seedScenarios()} shipped with an empty body and no callers, so a fresh
 * install had an empty scenario list and roleplay was unusable out of the box.
 */
class ScenarioSeedTest {

    @Test
    void seedsDefaultScenariosOnAFreshInstall() {
        ScenarioRepository repository = mock(ScenarioRepository.class);
        when(repository.count()).thenReturn(0L);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        new ScenarioService(repository, null, null, null, null).seedScenarios();

        ArgumentCaptor<Scenario> captor = ArgumentCaptor.forClass(Scenario.class);
        verify(repository, times(3)).save(captor.capture());

        List<Scenario> seeded = captor.getAllValues();
        assertThat(seeded).hasSize(3);
        assertThat(seeded).allSatisfy(s -> {
            assertThat(s.getTitle()).isNotBlank();
            assertThat(s.getLanguage()).isNotBlank();
            assertThat(s.getContextPrompt()).isNotBlank();
            assertThat(s.getInitialMessage()).isNotBlank();
        });
        assertThat(seeded).extracting(Scenario::getTitle).doesNotHaveDuplicates();
    }

    @Test
    void isANoOpWhenScenariosAlreadyExist() {
        ScenarioRepository repository = mock(ScenarioRepository.class);
        when(repository.count()).thenReturn(7L);

        new ScenarioService(repository, null, null, null, null).seedScenarios();

        verify(repository, times(0)).save(any());
    }
}