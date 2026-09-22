package com.immersio;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static org.assertj.core.api.Assertions.assertThat;

class ModulithArchitectureTest {

    ApplicationModules modules = ApplicationModules.of(ImmersioApplication.class);

    @Test
    void discoversAllModules() {
        assertThat(modules.getModuleByName("users")).isPresent();
        assertThat(modules.getModuleByName("flashcards")).isPresent();
        assertThat(modules.getModuleByName("scenarios")).isPresent();
        assertThat(modules.getModuleByName("practice")).isPresent();
        assertThat(modules.getModuleByName("subscriptions")).isPresent();
        assertThat(modules.getModuleByName("upload")).isPresent();
        assertThat(modules.getModuleByName("shared")).isPresent();
    }
}
