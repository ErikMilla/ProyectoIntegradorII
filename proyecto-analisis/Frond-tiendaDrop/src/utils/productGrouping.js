export const agruparPorProducto = (detalles) => {
    if (!detalles || detalles.length === 0) return [];
    
    const productosAgrupados = {};

    detalles.forEach(detalle => {
        // Aseguramos que el producto maestro exista
        if (!detalle.producto || !detalle.producto.id) return; 

        const productoId = detalle.producto.id; 
        
        if (!productosAgrupados[productoId]) {
            productosAgrupados[productoId] = {
                // Copia todas las propiedades del Producto Maestro
                ...detalle.producto, 
                variantes: [] 
            };
        }
        
        // Añadimos el detalle (la talla/stock específica) como una variante
        productosAgrupados[productoId].variantes.push(detalle);
    });

    return Object.values(productosAgrupados);
};