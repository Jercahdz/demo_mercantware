import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { guardarSesion, obtenerSesion } from "../../utils/session";

interface SettingsScreenProps {
  onLogout: (type?: "normal" | "restore") => void;
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const navigation = useNavigation<any>();

  // MODAL EDITAR PERFIL
  const [modalEditarPerfil, setModalEditarPerfil] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");

  const [modalTerminosVisible, setModalTerminosVisible] = useState(false);

  const [modalPremiumVisible, setModalPremiumVisible] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const sesion = await obtenerSesion();
      setUsuario(sesion);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalEditarPerfil = () => {
    setNuevoNombre(usuario?.Nombre || "");
    setNuevoCorreo(usuario?.Correo || "");
    setModalEditarPerfil(true);
  };

  const guardarPerfil = async () => {
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) {
      Alert.alert("Error", "Todos los campos son requeridos");
      return;
    }

    try {
      const { db } = require("../../database/database");

      // ACTUALIZAR EN LA BASE DE DATOS
      await db.runAsync(
        "UPDATE usuarios SET Nombre = ?, Correo = ? WHERE IdUsuario = ?",
        [nuevoNombre, nuevoCorreo, usuario.IdUsuario],
      );

      // ACTUALIZAR SESIÓN
      const nuevaSesion = {
        ...usuario,
        Nombre: nuevoNombre,
        Correo: nuevoCorreo,
      };

      await guardarSesion(nuevaSesion);
      setUsuario(nuevaSesion);
      setModalEditarPerfil(false);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configuración</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona tu cuenta y preferencias
          </Text>
        </View>

        {/* PERFIL DEL USUARIO */}
        {usuario && (
          <View style={styles.perfilCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Feather name="user" size={36} color="#fff" />
              </View>
            </View>
            <Text style={styles.perfilNombre}>{usuario.Nombre}</Text>
            <Text style={styles.perfilCorreo}>{usuario.Correo}</Text>
          </View>
        )}

        {/* OPCIONES DE CUENTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setModalPremiumVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Feather name="edit-3" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.menuItemText}>Editar Perfil</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* SECCIÓN DE DATOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setModalPremiumVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Feather name="cloud" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.menuItemText}>Respaldo y Restauración</Text>
                <Text style={styles.menuItemSubtext}>
                  Guarda y recupera tus datos
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* INFORMACIÓN Y SOPORTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información y Soporte</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setModalTerminosVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Feather name="file-text" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.menuItemText}>Términos y Condiciones</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Feather name="info" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.menuItemText}>Acerca de</Text>
                <Text style={styles.menuItemSubtext}>Versión 1.0.0</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => onLogout("normal")}
        >
          <Feather name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalPremiumVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Feather name="lock" size={50} color="#3b82f6" />

            <Text style={styles.overlayTitle}>Función Premium</Text>

            <Text style={styles.overlayText}>
              Para desbloquear esta sección contactanos para adquirir la versión
              completa
            </Text>

            <View style={styles.premiumButtons}>
              <TouchableOpacity
                style={styles.premiumButtonUpgrade}
                onPress={() => setModalPremiumVisible(false)}
              >
                <Text style={styles.premiumButtonUpgradeText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalTerminosVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.termsContainer}>
            <View style={styles.termsHeader}>
              <Feather name="file-text" size={24} color="#3b82f6" />
              <Text style={styles.overlayTitle}>Términos y Condiciones</Text>
            </View>

            <ScrollView
              style={styles.termsScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>1. Uso de la Aplicación</Text>
                <Text style={styles.termsText}>
                  MercantWare es una aplicación para la gestión de negocios. El
                  usuario se compromete a utilizarla de manera responsable y
                  conforme a la ley.
                </Text>
              </View>

              <View style={styles.termsDivider} />

              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>
                  2. Responsabilidad del Usuario
                </Text>
                <Text style={styles.termsText}>
                  El usuario es responsable de la información ingresada y del
                  uso que le dé a la aplicación.
                </Text>
              </View>

              <View style={styles.termsDivider} />

              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>
                  3. Limitación de Responsabilidad
                </Text>
                <Text style={styles.termsText}>
                  MercantWare no garantiza que la aplicación esté libre de
                  errores o interrupciones. El uso es bajo su propio riesgo.
                </Text>
              </View>

              <View style={styles.termsDivider} />

              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>
                  4. Respaldo de Información
                </Text>
                <Text style={styles.termsText}>
                  El usuario es responsable de realizar respaldos periódicos. No
                  nos hacemos responsables por pérdida de datos.
                </Text>
              </View>

              <View style={styles.termsDivider} />

              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>5. Funciones Premium</Text>
                <Text style={styles.termsText}>
                  Algunas funciones pueden requerir una versión premium. Estas
                  pueden cambiar sin previo aviso.
                </Text>
              </View>

              <View style={styles.termsDivider} />

              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>6. Privacidad</Text>
                <Text style={styles.termsText}>
                  La información pertenece al usuario. Es su responsabilidad
                  proteger sus datos.
                </Text>
              </View>

              <View style={styles.termsDivider} />

              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>7. Modificaciones</Text>
                <Text style={styles.termsText}>
                  Estos términos pueden ser actualizados en cualquier momento.
                </Text>
              </View>

              <View style={styles.termsDivider} />

              <View style={styles.termsBlock}>
                <Text style={styles.termsTitle}>8. Aceptación</Text>
                <Text style={styles.termsText}>
                  El uso de la app implica la aceptación de estos términos.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.termsButton}
              onPress={() => setModalTerminosVisible(false)}
            >
              <Text style={styles.termsButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  perfilCard: {
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  perfilNombre: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  perfilCorreo: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  menuItemSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  themeText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalButtonSave: {
    backgroundColor: "#3b82f6",
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalConfirmar: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalConfirmarIcono: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalConfirmarTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalConfirmarTexto: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalConfirmarBotones: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonLogout: {
    backgroundColor: "#ef4444",
  },
  modalButtonLogoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  overlayContent: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    width: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  overlayTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 14,
    color: "#111827",
  },

  overlayText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },

  termsContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },

  termsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  termsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  termsDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 10,
  },

  termsScroll: {
    marginTop: 10,
  },

  termsText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },

  termsButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },

  termsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  termsBlock: {
    marginBottom: 12,
  },

  premiumButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  premiumButtonClose: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  premiumButtonCloseText: {
    color: "#6b7280",
    fontWeight: "600",
  },

  premiumButtonUpgrade: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  premiumButtonUpgradeText: {
    color: "#fff",
    fontWeight: "600",
  },
});
