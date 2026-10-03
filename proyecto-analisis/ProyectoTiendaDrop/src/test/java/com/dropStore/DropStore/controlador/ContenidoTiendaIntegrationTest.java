package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ContenidoTiendaIntegrationTest {

    @Autowired MockMvc mvc;
    @MockitoBean FileStorageService fileStorageService;

    @Test
    void laPortadaPuedeConsultarElContenidoPredeterminadoSinIniciarSesion() throws Exception {
        mvc.perform(get("/api/contenido-tienda"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Streetwear que marca el paso."))
                .andExpect(jsonPath("$.alturaEscritorio").value(440));
    }

    @Test
    void soloElAdministradorPuedeActualizarElContenido() throws Exception {
        String datos = "{\"titulo\":\"Nueva campaña\",\"etiqueta\":\"Temporada\",\"textoBoton\":\"Ver colección\",\"enlaceBoton\":\"/catalogo\",\"mensajePromocional\":\"Envío gratis\",\"alturaEscritorio\":420,\"alturaMovil\":340,\"posicionImagen\":\"centro\"}";

        mvc.perform(multipart("/api/contenido-tienda")
                        .param("data", datos)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void elAdministradorPuedeActualizarTextosYDimensiones() throws Exception {
        String datos = "{\"titulo\":\"Nueva campaña\",\"etiqueta\":\"Temporada\",\"textoBoton\":\"Ver colección\",\"enlaceBoton\":\"/catalogo\",\"mensajePromocional\":\"Envío gratis\",\"alturaEscritorio\":420,\"alturaMovil\":340,\"posicionImagen\":\"derecha\"}";

        mvc.perform(multipart("/api/contenido-tienda")
                        .param("data", datos)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .with(user("admin@dropstore.local").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Nueva campaña"))
                .andExpect(jsonPath("$.alturaEscritorio").value(420))
                .andExpect(jsonPath("$.posicionImagen").value("derecha"));
    }

    @Test
    void elAdministradorPuedePublicarUnaNuevaImagenDeBanner() throws Exception {
        String datos = "{\"titulo\":\"Nueva campaña\",\"etiqueta\":\"Temporada\",\"textoBoton\":\"Ver colección\",\"enlaceBoton\":\"/catalogo\",\"mensajePromocional\":\"Envío gratis\",\"alturaEscritorio\":420,\"alturaMovil\":340,\"posicionImagen\":\"centro\"}";
        MockMultipartFile imagen = new MockMultipartFile(
                "file", "banner.webp", "image/webp", new byte[]{1, 2, 3});
        when(fileStorageService.storeFile(imagen)).thenReturn("/uploads/banner.webp");

        mvc.perform(multipart("/api/contenido-tienda")
                        .file(imagen)
                        .param("data", datos)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .with(user("admin@dropstore.local").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagenBanner").value("/uploads/banner.webp"));
    }
}
