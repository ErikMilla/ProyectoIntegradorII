package com.dropStore.DropStore.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PropertiesLoaderUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class LocalPersistenceConfigurationTest {

    @Test
    void elPerfilLocalGuardaLaBaseEnDiscoYSoloActualizaElEsquema() throws Exception {
        Properties properties = PropertiesLoaderUtils.loadProperties(
                new ClassPathResource("application-local.properties"));

        assertThat(properties.getProperty("spring.datasource.url"))
                .startsWith("jdbc:h2:file:");
        assertThat(properties.getProperty("spring.jpa.hibernate.ddl-auto"))
                .isEqualTo("update");
    }
}
