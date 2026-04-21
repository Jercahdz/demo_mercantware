import * as Crypto from 'expo-crypto';
import { db } from '../database/database';
import { sendPasswordResetEmail } from './emailService';

interface Usuario {
  IdUsuario?: number;
  Nombre: string;
  Correo: string;
  Contrasena: string;
}

interface Recuperacion {
  id?: number;
  correo: string;
  token: string;
  expiracion: number;
}

// 🔹 Crear un nuevo usuario
export const createUser = async (nombre: string, correo: string, contrasena: string): Promise<void> => {
  try {
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      contrasena
    );

    await db.runAsync(
      'INSERT INTO usuarios (Nombre, Correo, Contrasena) VALUES (?, ?, ?);',
      [nombre, correo, hashedPassword]
    );

    console.log('✅ Usuario registrado correctamente');
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error('El correo ya está registrado.');
    }
    console.error('❌ Error creando usuario:', error);
    throw error;
  }
};

// 🔹 Obtener usuario por correo
export const getUserByEmail = async (correo: string): Promise<Usuario | null> => {
  try {
    const result = await db.getFirstAsync<Usuario>(
      'SELECT * FROM usuarios WHERE Correo = ?;',
      [correo]
    );
    return result || null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    throw error;
  }
};

// 🔹 Generar token y enviar correo de recuperación
export const sendRecoveryEmail = async (correo: string): Promise<void> => {
  try {
    const usuario = await getUserByEmail(correo);
    if (!usuario) throw new Error('Usuario no encontrado');

    const token = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Date.now().toString()
    );

    const expiracion = Date.now() + 1000 * 60 * 15;

    const recoveryLink = `mercantware://reset-password?token=${token}`;

    const emailSent = await sendPasswordResetEmail(usuario.Nombre, correo, recoveryLink);

    if (!emailSent) {
      throw new Error('Error enviando el correo');
    }

    await db.runAsync(
      'INSERT INTO recuperaciones (correo, token, expiracion) VALUES (?, ?, ?);',
      [correo, token, expiracion]
    );

    console.log('📧 Correo enviado correctamente a:', correo);

  } catch (error) {
    console.error('❌ Error enviando correo de recuperación:', error);
    throw error;
  }
};

// 🔹 Verificar si el token es válido
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const result = await db.getFirstAsync<Recuperacion>(
      'SELECT * FROM recuperaciones WHERE token = ?;',
      [token]
    );

    if (!result) return false;
    return result.expiracion > Date.now();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return false;
  }
};

// 🔹 Actualizar contraseña
export const updatePassword = async (correo: string, nuevaContrasena: string): Promise<void> => {
  try {
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nuevaContrasena
    );

    await db.runAsync(
      'UPDATE usuarios SET Contrasena = ? WHERE Correo = ?;',
      [hashedPassword, correo]
    );

    console.log('🔐 Contraseña actualizada correctamente');
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error);
    throw error;
  }
};

export const updatePasswordWithToken = async (token: string, nuevaContrasena: string) => {
  const record = await db.getFirstAsync<Recuperacion>(
    'SELECT * FROM recuperaciones WHERE token = ?;',
    [token]
  );

  if (!record || record.expiracion < Date.now()) {
    throw new Error('Token inválido o expirado');
  }

  const hashedPassword = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nuevaContrasena
  );

  await db.runAsync(
    'UPDATE usuarios SET Contrasena = ? WHERE Correo = ?;',
    [hashedPassword, record.correo]
  );

  await db.runAsync(
    'DELETE FROM recuperaciones WHERE token = ?;',
    [token]
  );
};