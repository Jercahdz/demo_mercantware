import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'usuario_sesion';

export interface UsuarioSesion {
  IdUsuario?: number;
  Nombre: string;
  Correo: string;
}

export const guardarSesion = async (usuario: UsuarioSesion): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuario));
    await AsyncStorage.setItem('userId', String(usuario.IdUsuario ?? ''));
    console.log('✅ Sesión guardada correctamente');
  } catch (error) {
    console.error('❌ Error guardando sesión:', error);
  }
};

export const obtenerSesion = async (): Promise<UsuarioSesion | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    if (data) {
      const usuario: UsuarioSesion = JSON.parse(data);
      return usuario;
    }
    console.log('ℹ️ No hay sesión activa');
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo sesión:', error);
    return null;
  }
};

// CERRAR SESIÓN
export const cerrarSesion = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem('userId');
    console.log('👋 Sesión cerrada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    return false;
  }
};

export const haySesionActiva = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return !!data;
  } catch (error) {
    console.error('❌ Error verificando sesión activa:', error);
    return false;
  }
};