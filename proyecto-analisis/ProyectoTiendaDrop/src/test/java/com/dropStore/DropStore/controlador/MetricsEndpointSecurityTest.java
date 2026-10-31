package com.dropStore.DropStore.controlador;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Las métricas muestran CPU, memoria y conexiones a la base de datos: son
 * información interna, solo para el administrador.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MetricsEndpointSecurityTest {

    @Autowired MockMvc mvc;

    @Test
    void sinSesionNoSePuedenConsultarLasMetricas() throws Exception {
        mvc.perform(get("/actuator/metrics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CLIENTE")
    void unClienteNoPuedeConsultarLasMetricas() throws Exception {
        mvc.perform(get("/actuator/metrics"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/actuator/metrics/jvm.memory.used"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"VENDEDOR"})
    void unVendedorTampocoPuedeConsultarLasMetricas() throws Exception {
        mvc.perform(get("/actuator/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void elAdministradorVeLasMetricasDeCpuMemoriaYDisco() throws Exception {
        mvc.perform(get("/actuator/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.names").value(org.hamcrest.Matchers.hasItems(
                        "process.cpu.usage", "jvm.memory.used", "disk.free")));
        mvc.perform(get("/actuator/metrics/jvm.memory.used"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("jvm.memory.used"));
    }
}
