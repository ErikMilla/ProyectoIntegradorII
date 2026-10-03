/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.dropStore.DropStore.Dto;

import java.util.List;

/**
 *
 * @author USER
 */
public class VentaRequestDto {
    private Long usuarioId;
    private String metodoPago;
    private double subtotal;
    private double costoEnvio;
    private double igv;
    private double total;
    private ClienteDto cliente; // Datos de contacto/entrega del comprador
    // "Online" (tienda web) o "Presencial" (POS). Si no llega, se asume Online.
    private String tipoVenta;
    private String codigoDescuento;
    private List<DetalleVentaRequestDto> items; // Lista de items del carrito

    // Getters y Setters
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
    public double getCostoEnvio() { return costoEnvio; }
    public void setCostoEnvio(double costoEnvio) { this.costoEnvio = costoEnvio; }
    public double getIgv() { return igv; }
    public void setIgv(double igv) { this.igv = igv; }
    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }
    public String getTipoVenta() { return tipoVenta; }
    public void setTipoVenta(String tipoVenta) { this.tipoVenta = tipoVenta; }
    public String getCodigoDescuento() { return codigoDescuento; }
    public void setCodigoDescuento(String codigoDescuento) { this.codigoDescuento = codigoDescuento; }
    public ClienteDto getCliente() { return cliente; }
    public void setCliente(ClienteDto cliente) { this.cliente = cliente; }
    public List<DetalleVentaRequestDto> getItems() { return items; }
    public void setItems(List<DetalleVentaRequestDto> items) { this.items = items; }
}
