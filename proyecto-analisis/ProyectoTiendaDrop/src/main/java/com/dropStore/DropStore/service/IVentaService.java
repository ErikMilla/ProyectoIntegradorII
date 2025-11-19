/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Modelo.Venta;
import java.util.List;
public interface IVentaService {
     Venta registrarVenta(VentaRequestDto ventaDto);
      List<Venta> listarVentasPorUsuario(Long usuarioId);
}
