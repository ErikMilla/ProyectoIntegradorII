package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.marca;
import com.dropStore.DropStore.Repositorio.MarcaRepository;
import com.dropStore.DropStore.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BusquedaControllerIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired MarcaRepository marcaRepository;
    @MockitoBean FileStorageService fileStorageService;

    @Test
    void unVisitanteObtieneLosFiltrosDeSuFraseConLasMarcasDeLaBase() throws Exception {
        marca puma = new marca();
        puma.setNombre("Puma");
        marcaRepository.save(puma);

        mvc.perform(get("/api/productos/interpretar").param("q", "pumas rojas para mujer talla 37 hasta 350 soles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.marca").value("Puma"))
                .andExpect(jsonPath("$.color").value("Rojo"))
                .andExpect(jsonPath("$.genero").value("Mujer"))
                .andExpect(jsonPath("$.talla").value(37.0))
                .andExpect(jsonPath("$.precioMaximo").value(350.0))
                .andExpect(jsonPath("$.texto").value(""));
    }

    @Test
    void rechazaUnaFraseDemasiadoLarga() throws Exception {
        mvc.perform(get("/api/productos/interpretar").param("q", "a".repeat(201)))
                .andExpect(status().isBadRequest());
    }
}
