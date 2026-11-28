package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Modelo.categoria;
import com.dropStore.DropStore.Modelo.marca;
import com.dropStore.DropStore.Repositorio.CategoriaRepository;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.MarcaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Búsqueda en lenguaje natural del catálogo.
 *
 * Arma el vocabulario con las marcas, categorías y colores que existen en la
 * base de datos en ese momento, de modo que una marca nueva se reconoce sin
 * tocar código, y delega la lectura de la frase en {@link InterpreteConsulta}.
 */
@Service
public class BusquedaNaturalService {

    private final MarcaRepository marcaRepository;
    private final CategoriaRepository categoriaRepository;
    private final DetalleProductoRepository detalleProductoRepository;

    public BusquedaNaturalService(MarcaRepository marcaRepository,
                                  CategoriaRepository categoriaRepository,
                                  DetalleProductoRepository detalleProductoRepository) {
        this.marcaRepository = marcaRepository;
        this.categoriaRepository = categoriaRepository;
        this.detalleProductoRepository = detalleProductoRepository;
    }

    @Transactional(readOnly = true)
    public InterpretacionBusqueda interpretar(String consulta) {
        List<String> marcas = marcaRepository.findAll().stream()
                .map(marca::getNombre).filter(Objects::nonNull).toList();
        List<String> categorias = categoriaRepository.findAll().stream()
                .map(categoria::getNombre).filter(Objects::nonNull).toList();
        List<String> colores = detalleProductoRepository.findColoresDistintos();
        return new InterpreteConsulta(marcas, categorias, colores).interpretar(consulta);
    }
}
