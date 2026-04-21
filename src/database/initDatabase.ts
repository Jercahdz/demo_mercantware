import { db } from './database';

export const initDatabase = async (): Promise<void> => {
  try {
    // Tabla de usuarios 
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        IdUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
        Nombre TEXT NOT NULL,
        Correo TEXT NOT NULL UNIQUE,
        Contrasena TEXT NOT NULL
      );
    `);

    // Tabla para recuperación de contraseñas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recuperaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correo TEXT NOT NULL,
        token TEXT NOT NULL,
        expiracion INTEGER NOT NULL
      );
    `);
    
    // Tabla de clientes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT,
        correo TEXT,
        IdUsuario INTEGER NOT NULL,
        FOREIGN KEY (IdUsuario) REFERENCES usuarios(IdUsuario)
      );
    `);
    
    // Tabla de productos
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS productos (
        IdProducto INTEGER PRIMARY KEY AUTOINCREMENT,
        Nombre TEXT NOT NULL,
        Categoria TEXT,
        Precio REAL NOT NULL,
        Cantidad INTEGER DEFAULT 0,
        IdUsuario INTEGER NOT NULL,
        FOREIGN KEY (IdUsuario) REFERENCES usuarios(IdUsuario)
      );
    `);

    // Tabla de facturas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS facturas (
        IdFactura INTEGER PRIMARY KEY AUTOINCREMENT,
        Fecha TEXT NOT NULL,
        Total REAL NOT NULL,
        Tipo TEXT CHECK(Tipo IN ('Contado', 'Credito')) NOT NULL,
        Estado TEXT CHECK(Estado IN ('Activo', 'Inactivo')) NOT NULL,
        IdCliente INTEGER,
        IdUsuario INTEGER NOT NULL,
        FOREIGN KEY (IdCliente) REFERENCES clientes(id),
        FOREIGN KEY (IdUsuario) REFERENCES usuarios(IdUsuario)
      );
    `);

    // Tabla para el detalle de facturas (múltiples productos por factura)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS facturas_detalle (
        IdDetalle INTEGER PRIMARY KEY AUTOINCREMENT,
        IdFactura INTEGER NOT NULL,
        IdProducto INTEGER NOT NULL,
        Cantidad INTEGER NOT NULL,
        PrecioUnitario REAL NOT NULL,
        Subtotal REAL NOT NULL,
        FOREIGN KEY (IdFactura) REFERENCES facturas(IdFactura) ON DELETE CASCADE,
        FOREIGN KEY (IdProducto) REFERENCES productos(IdProducto)
      );
    `);

    console.log('✅ Tablas creadas correctamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
};