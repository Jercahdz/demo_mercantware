import { db } from '../database/database';
import { obtenerSesion } from '../utils/session';

// Insertar un nuevo producto
export const insertProduct = async (
  nombre: string,
  categoria: string,
  precio: number,
  cantidad: number
): Promise<number> => {
  try {
    console.log('➕ Insertando producto:', nombre);

    const sesion = await obtenerSesion();
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    const result = await db.runAsync(
      `INSERT INTO productos (Nombre, Categoria, Precio, Cantidad, IdUsuario)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, categoria, precio, cantidad, sesion.IdUsuario]
    );

    console.log('✅ Producto insertado con ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('❌ Error al insertar producto:', error);
    throw error;
  }
};

// Obtener todos los productos del usuario logueado
export const getProducts = async (
  orderBy?: 'stock_asc' | 'stock_desc'
): Promise<any[]> => {
  try {
    console.log('🔄 Obteniendo productos...');

    const sesion = await obtenerSesion();
    console.log('🔍 Sesión obtenida:', JSON.stringify(sesion)); // ✅ VER SESIÓN
    
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    console.log('👤 Buscando productos para usuario ID:', sesion.IdUsuario, 'tipo:', typeof sesion.IdUsuario);

    // ✅ VER TODOS LOS PRODUCTOS EN LA BD
    const todosProductos = await db.getAllAsync('SELECT * FROM productos');
    console.log('🗂️ TODOS los productos en BD:', JSON.stringify(todosProductos));

    let query = `
      SELECT IdProducto, Nombre, Categoria, Precio, Cantidad
      FROM productos
      WHERE IdUsuario = ?
    `;

    if (orderBy === 'stock_asc') query += ' ORDER BY Cantidad ASC';
    else if (orderBy === 'stock_desc') query += ' ORDER BY Cantidad DESC';
    else query += ' ORDER BY IdProducto DESC';

    const productos = await db.getAllAsync(query, [sesion.IdUsuario]);

    console.log('✅ Productos filtrados para usuario:', productos.length, JSON.stringify(productos));
    return productos;
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    throw error;
  }
};

export const getCategorias = async (): Promise<string[]> => {
  try {
    const sesion = await obtenerSesion();
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    const result = await db.getAllAsync(
      `SELECT DISTINCT Categoria FROM productos WHERE IdUsuario = ?`,
      [sesion.IdUsuario]
    );

    const categorias: string[] = ["Todas"];

    result.forEach((row: any) => {
      if (row.Categoria && !categorias.includes(row.Categoria)) {
        categorias.push(row.Categoria);
      }
    });

    return categorias;
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    return ["Todas"];
  }
};

// Actualizar producto
export const updateProduct = async (
  id: number,
  nombre: string,
  categoria: string,
  precio: number,
  cantidad: number
): Promise<boolean> => {
  try {
    console.log('✏️ Actualizando producto ID:', id);

    const sesion = await obtenerSesion();
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    await db.runAsync(
      `UPDATE productos
       SET Nombre = ?, Categoria = ?, Precio = ?, Cantidad = ?
       WHERE IdProducto = ? AND IdUsuario = ?`,
      [nombre, categoria, precio, cantidad, id, sesion.IdUsuario]
    );

    console.log('✅ Producto actualizado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    throw error;
  }
};

// Eliminar producto
export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando producto ID:', id);

    const sesion = await obtenerSesion();
    if (!sesion?.IdUsuario) throw new Error('No hay usuario logueado');

    await db.runAsync(
      `DELETE FROM productos WHERE IdProducto = ? AND IdUsuario = ?`,
      [id, sesion.IdUsuario]
    );

    console.log('✅ Producto eliminado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    throw error;
  }
};