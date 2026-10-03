package com.dropStore.DropStore.config;

import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Repositorio.CategoriaRepository;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.MarcaRepository;
import com.dropStore.DropStore.Repositorio.ProductoRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.service.PasswordService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock UsuarioRepository usuarioRepository;
    @Mock MarcaRepository marcaRepository;
    @Mock CategoriaRepository categoriaRepository;
    @Mock ProductoRepository productoRepository;
    @Mock DetalleProductoRepository detalleProductoRepository;
    @Mock PasswordService passwordService;

    @Test
    void usaElCorreoConfiguradoParaElAdministradorDeDemostracion() {
        DataSeeder seeder = new DataSeeder(
                usuarioRepository, marcaRepository, categoriaRepository,
                productoRepository, detalleProductoRepository, passwordService);
        ReflectionTestUtils.setField(seeder, "demoPassword", "Demo-Local-2026!");
        ReflectionTestUtils.setField(seeder, "adminEmail", "dropstore1412@gmail.com");
        when(usuarioRepository.findByCorreo(anyString())).thenReturn(Optional.empty());
        when(passwordService.cifrar(anyString())).thenReturn("hash-seguro");

        ReflectionTestUtils.invokeMethod(seeder, "crearUsuariosDeDemostracion");

        ArgumentCaptor<Usuario> usuarios = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository, times(4)).save(usuarios.capture());
        Usuario administrador = usuarios.getAllValues().stream()
                .filter(usuario -> "ADMIN".equals(usuario.getRol()))
                .findFirst()
                .orElseThrow();
        assertThat(administrador.getCorreo()).isEqualTo("dropstore1412@gmail.com");
    }
}
