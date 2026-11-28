package com.dropStore.DropStore.Repositorio;

import com.dropStore.DropStore.Modelo.Resena;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.producto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * La base rechaza una segunda reseña del mismo cliente al mismo producto
 * (restricción uk_resena_producto_usuario), aunque se salte la revisión del
 * controlador.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ResenaRepositoryTest {

    @Autowired ResenaRepository resenaRepository;
    @Autowired TestEntityManager em;

    private producto zapatilla;
    private producto otraZapatilla;
    private Usuario ana;
    private Usuario luis;

    @BeforeEach
    void preparar() {
        zapatilla = em.persist(producto("Nike Air Force 1"));
        otraZapatilla = em.persist(producto("Adidas Samba OG"));
        ana = em.persist(cliente("ana@correo.com"));
        luis = em.persist(cliente("luis@correo.com"));
        em.flush();
    }

    private static producto producto(String nombre) {
        producto p = new producto();
        p.setNombre(nombre);
        return p;
    }

    private static Usuario cliente(String correo) {
        Usuario u = new Usuario();
        u.setNombre("Cliente");
        u.setCorreo(correo);
        u.setRol("CLIENTE");
        return u;
    }

    private static Resena resena(producto p, Usuario u, int estrellas) {
        Resena r = new Resena();
        r.setProducto(p);
        r.setUsuario(u);
        r.setCalificacion(estrellas);
        r.setComentario("Opinión de prueba");
        r.setFecha(new Date());
        return r;
    }

    @Test
    void rechazaUnaSegundaResenaDelMismoClienteAlMismoProducto() {
        resenaRepository.saveAndFlush(resena(zapatilla, ana, 5));

        assertThrows(DataIntegrityViolationException.class,
                () -> resenaRepository.saveAndFlush(resena(zapatilla, ana, 1)));
    }

    @Test
    void elMismoClientePuedeOpinarDeOtroProductoYOtroClienteDelMismo() {
        resenaRepository.saveAndFlush(resena(zapatilla, ana, 5));
        resenaRepository.saveAndFlush(resena(otraZapatilla, ana, 4));
        resenaRepository.saveAndFlush(resena(zapatilla, luis, 3));

        assertEquals(3, resenaRepository.count());
    }
}
