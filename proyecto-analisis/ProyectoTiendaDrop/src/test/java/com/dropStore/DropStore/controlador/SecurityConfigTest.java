package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Repositorio.VentaRepository;
import com.dropStore.DropStore.config.SecurityConfig;
import com.dropStore.DropStore.service.IVentaService;
import com.dropStore.DropStore.service.ReporteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VentaController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired MockMvc mvc;
    @MockitoBean IVentaService ventaService;
    @MockitoBean VentaRepository ventaRepository;
    @MockitoBean ReporteService reporteService;

    @Test
    void unaPersonaSinSesionNoPuedeAnularVentas() throws Exception {
        mvc.perform(delete("/api/v1/ventas/10").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CLIENTE")
    void unClienteNoPuedeAnularVentas() throws Exception {
        mvc.perform(delete("/api/v1/ventas/10").with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void unAdministradorPuedeAnularVentas() throws Exception {
        mvc.perform(delete("/api/v1/ventas/10").with(csrf()))
                .andExpect(status().isNoContent());
    }
}
