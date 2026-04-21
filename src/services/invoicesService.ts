import { db } from '../database/database';
import { obtenerSesion } from '../utils/session';

// ==================== INSERTAR FACTURA CON MÚLTIPLES PRODUCTOS ====================
export const insertFactura = async (
  fecha: string,
  tipo: string,
  estado: string,
  idCliente: number,
  productos: Array<{ idProducto: number; cantidad: number; precioUnitario: number }>,
  totalFinal?: number // Total editable opcional
): Promise<number> => {
  try {
    console.log('➕ Insertando factura para cliente ID:', idCliente);

    // ✅ Obtener usuario logueado
    const usuario = await obtenerSesion();
    if (!usuario?.IdUsuario) throw new Error('No hay usuario logueado');

    // ✅ VALIDAR STOCK ANTES DE CREAR LA FACTURA
    for (const producto of productos) {
      const stockActual: any = await db.getFirstAsync(
        'SELECT Cantidad, Nombre FROM productos WHERE IdProducto = ? AND IdUsuario = ?',
        [producto.idProducto, usuario.IdUsuario]
      );

      if (!stockActual) {
        throw new Error(`Producto con ID ${producto.idProducto} no encontrado`);
      }

      if (stockActual.Cantidad < producto.cantidad) {
        throw new Error(
          `Stock insuficiente para "${stockActual.Nombre}". Disponible: ${stockActual.Cantidad}, Solicitado: ${producto.cantidad}`
        );
      }
    }

    // Usar total editable si se proporciona, sino calcular
    const total = totalFinal !== undefined 
      ? totalFinal 
      : productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);

    // ✅ Insertar factura principal con IdUsuario
    const result = await db.runAsync(
      'INSERT INTO facturas (Fecha, Total, Tipo, Estado, IdCliente, IdUsuario) VALUES (?, ?, ?, ?, ?, ?)',
      [fecha, total, tipo, estado, idCliente, usuario.IdUsuario]
    );

    const idFactura = result.lastInsertRowId;
    console.log('✅ Factura insertada con ID:', idFactura, '- Total:', total);

    // ✅ Insertar detalle de productos Y DESCONTAR STOCK
    for (const producto of productos) {
      const subtotal = producto.cantidad * producto.precioUnitario;
      
      // Insertar detalle
      await db.runAsync(
        'INSERT INTO facturas_detalle (IdFactura, IdProducto, Cantidad, PrecioUnitario, Subtotal) VALUES (?, ?, ?, ?, ?)',
        [idFactura, producto.idProducto, producto.cantidad, producto.precioUnitario, subtotal]
      );

      // 🔥 DESCONTAR STOCK DEL PRODUCTO
      await db.runAsync(
        'UPDATE productos SET Cantidad = Cantidad - ? WHERE IdProducto = ? AND IdUsuario = ?',
        [producto.cantidad, producto.idProducto, usuario.IdUsuario]
      );

      console.log(`✅ Stock descontado: Producto ${producto.idProducto} - Cantidad: ${producto.cantidad}`);
    }

    console.log('✅ Detalle de factura insertado y stock actualizado correctamente');
    return idFactura;
  } catch (error) {
    console.error('❌ Error al insertar factura:', error);
    throw error;
  }
};

// ==================== OBTENER TODAS LAS FACTURAS ====================
export const getFacturas = async (): Promise<any[]> => {
  try {
    console.log('🔄 Obteniendo facturas...');

    // ✅ Obtener usuario logueado
    const usuario = await obtenerSesion();
    if (!usuario?.IdUsuario) throw new Error('No hay usuario logueado');

    const facturas = await db.getAllAsync(`
      SELECT 
        f.IdFactura,
        f.Fecha,
        f.Total,
        f.Tipo,
        f.Estado,
        f.IdCliente,
        c.nombre as clienteNombre,
        c.correo as clienteCorreo,
        c.telefono as clienteTelefono,
        COUNT(fd.IdDetalle) as cantidadProductos
      FROM facturas f
      LEFT JOIN clientes c ON f.IdCliente = c.id
      LEFT JOIN facturas_detalle fd ON f.IdFactura = fd.IdFactura
      WHERE f.IdUsuario = ?
      GROUP BY f.IdFactura
      ORDER BY f.Fecha DESC
    `, [usuario.IdUsuario]);

    console.log('✅ Facturas obtenidas:', facturas.length);
    return facturas;
  } catch (error) {
    console.error('❌ Error al obtener facturas:', error);
    throw error;
  }
};

// ==================== OBTENER FACTURA POR ID CON DETALLE ====================
export const getFacturaById = async (id: number): Promise<any> => {
  try {
    console.log('🔍 Obteniendo factura ID:', id);

    // ✅ Obtener usuario logueado
    const usuario = await obtenerSesion();
    if (!usuario?.IdUsuario) throw new Error('No hay usuario logueado');

    // Obtener factura principal del usuario actual
    const factura = await db.getFirstAsync(`
      SELECT 
        f.IdFactura,
        f.Fecha,
        f.Total,
        f.Tipo,
        f.Estado,
        f.IdCliente,
        c.nombre as clienteNombre,
        c.correo as clienteCorreo,
        c.telefono as clienteTelefono
      FROM facturas f
      LEFT JOIN clientes c ON f.IdCliente = c.id
      WHERE f.IdFactura = ? AND f.IdUsuario = ?
    `, [id, usuario.IdUsuario]);

    if (!factura) {
      console.log('❌ Factura no encontrada o no pertenece al usuario');
      return null;
    }

    // Obtener detalle de productos
    const productos = await db.getAllAsync(`
      SELECT 
        fd.IdDetalle,
        fd.IdProducto,
        fd.Cantidad,
        fd.PrecioUnitario,
        fd.Subtotal,
        p.Nombre as productoNombre,
        p.Categoria as productoCategoria
      FROM facturas_detalle fd
      LEFT JOIN productos p ON fd.IdProducto = p.IdProducto
      WHERE fd.IdFactura = ?
    `, [id]);

    console.log('✅ Factura obtenida con', productos.length, 'productos');
    return { ...factura, productos };
  } catch (error) {
    console.error('❌ Error al obtener factura:', error);
    throw error;
  }
};

// ==================== OBTENER FACTURAS POR CLIENTE ====================
export const getFacturasByCliente = async (idCliente: number): Promise<any[]> => {
  try {
    console.log('🔄 Obteniendo facturas del cliente ID:', idCliente);

    // ✅ Obtener usuario logueado
    const usuario = await obtenerSesion();
    if (!usuario?.IdUsuario) throw new Error('No hay usuario logueado');

    const facturas = await db.getAllAsync(`
      SELECT 
        f.IdFactura,
        f.Fecha,
        f.Total,
        f.Tipo,
        f.Estado,
        COUNT(fd.IdDetalle) as cantidadProductos
      FROM facturas f
      LEFT JOIN facturas_detalle fd ON f.IdFactura = fd.IdFactura
      WHERE f.IdCliente = ? AND f.IdUsuario = ?
      GROUP BY f.IdFactura
      ORDER BY f.Fecha DESC
    `, [idCliente, usuario.IdUsuario]);

    console.log('✅ Facturas del cliente obtenidas:', facturas.length);
    return facturas;
  } catch (error) {
    console.error('❌ Error al obtener facturas del cliente:', error);
    throw error;
  }
};

// ==================== OBTENER ESTADÍSTICAS ====================
export const getEstadisticas = async (): Promise<any> => {
  try {
    console.log('📊 Obteniendo estadísticas...');

    // ✅ Obtener usuario logueado
    const usuario = await obtenerSesion();
    if (!usuario?.IdUsuario) throw new Error('No hay usuario logueado');

    const stats = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(Total) as montoTotal,
        SUM(CASE WHEN Estado = 'Activo' THEN 1 ELSE 0 END) as activas,
        SUM(CASE WHEN Estado = 'Inactivo' THEN 1 ELSE 0 END) as inactivas
      FROM facturas
      WHERE IdUsuario = ?
    `, [usuario.IdUsuario]);

    console.log('✅ Estadísticas obtenidas');
    return stats || { total: 0, montoTotal: 0, activas: 0, inactivas: 0 };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
};