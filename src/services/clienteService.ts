import { db } from '../database/database';
import { obtenerSesion } from '../utils/session';

export const insertCliente = async (
  nombre: string,
  telefono: string,
  correo: string
): Promise<number> => {
  try {
    console.log('➕ Insertando cliente:', nombre);

    const sesion = await obtenerSesion(); 
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    const result = await db.runAsync(
      'INSERT INTO clientes (nombre, telefono, correo, IdUsuario) VALUES (?, ?, ?, ?)',
      [nombre, telefono, correo, sesion.IdUsuario] 
    );

    console.log('✅ Cliente insertado con ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('❌ Error al insertar cliente:', error);
    throw error;
  }
};

export const getClientes = async (): Promise<any[]> => {
  try {
    console.log('🔄 Obteniendo clientes...');
    
    const sesion = await obtenerSesion();
    console.log('🔍 Sesión obtenida:', JSON.stringify(sesion)); 
    
    if (!sesion?.IdUsuario) {
      console.error('❌ No hay usuario logueado');
      throw new Error('No hay usuario logueado');
    }

    console.log('👤 Buscando clientes para usuario ID:', sesion.IdUsuario, 'tipo:', typeof sesion.IdUsuario);

    // ✅ VER TODOS LOS CLIENTES EN LA BD
    const todosClientes = await db.getAllAsync('SELECT * FROM clientes');
    console.log('🗂️ TODOS los clientes en BD:', JSON.stringify(todosClientes));

    const clientes = await db.getAllAsync(
      'SELECT * FROM clientes WHERE IdUsuario = ? ORDER BY id DESC',
      [sesion.IdUsuario]
    );

    console.log('✅ Clientes filtrados para usuario:', clientes.length, JSON.stringify(clientes));
    return clientes;
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    throw error;
  }
};

export const updateCliente = async (
  id: number,
  nombre: string,
  telefono: string,
  correo: string
): Promise<boolean> => {
  try {
    console.log('✏️ Actualizando cliente ID:', id);
    
    const sesion = await obtenerSesion(); 
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    await db.runAsync(
      'UPDATE clientes SET nombre = ?, telefono = ?, correo = ? WHERE id = ? AND IdUsuario = ?',
      [nombre, telefono, correo, id, sesion.IdUsuario] 
    );
    
    console.log('✅ Cliente actualizado');
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    throw error;
  }
};

export const deleteCliente = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando cliente ID:', id);
    
    const sesion = await obtenerSesion();
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    await db.runAsync(
      'DELETE FROM clientes WHERE id = ? AND IdUsuario = ?',
      [id, sesion.IdUsuario] 
    );
    
    console.log('✅ Cliente eliminado');
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    throw error;
  }
};

export const getUltimasFacturasByCliente = async (idCliente: number): Promise<any[]> => {
  try {
    console.log('🔄 Obteniendo últimas 3 facturas del cliente ID:', idCliente);

    const sesion = await obtenerSesion(); 
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

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
      LIMIT 3
    `, [idCliente, sesion.IdUsuario]);

    console.log('✅ Últimas facturas obtenidas:', facturas.length);
    return facturas;
  } catch (error) {
    console.error('❌ Error al obtener últimas facturas del cliente:', error);
    throw error;
  }
};