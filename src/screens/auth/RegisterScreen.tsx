import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomToast from "../../components/Toast";
import { createUser } from "../../services/usuarioService";

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({
  onNavigateToLogin,
}: RegisterScreenProps) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [modalTerminosVisible, setModalTerminosVisible] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleRegister = async () => {
    if (!nombre || !correo || !contrasena) {
      showToast("Por favor completa todos los campos", "error");
      return;
    }

    if (contrasena.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      showToast("Por favor ingresa un correo válido", "error");
      return;
    }

    setCargando(true);
    try {
      await createUser(nombre.trim(), correo.trim(), contrasena);
      showToast("¡Cuenta creada! Redirigiendo...", "success");

      setTimeout(() => {
        onNavigateToLogin();
      }, 1000);
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        showToast("Este correo ya está registrado", "error");
      } else {
        console.error("❌ Error creando usuario:", error);
        showToast("Ocurrió un error al registrar el usuario", "error");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="user-plus" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Completa tus datos para comenzar
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="user"
                  size={18}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Juan Pérez"
                  value={nombre}
                  onChangeText={setNombre}
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="mail"
                  size={18}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="correo@ejemplo.com"
                  value={correo}
                  onChangeText={setCorreo}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={18}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Mínimo 6 caracteres"
                  value={contrasena}
                  onChangeText={setContrasena}
                  secureTextEntry={!mostrarContrasena}
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={mostrarContrasena ? "eye-off" : "eye"}
                    size={18}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>
                Usa al menos 6 caracteres para mayor seguridad
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={cargando}
              style={[
                styles.registerButton,
                cargando && styles.registerButtonDisabled,
              ]}
            >
              {cargando ? (
                <View style={styles.buttonContent}>
                  <Feather name="loader" size={20} color="#fff" />
                  <Text style={styles.registerButtonText}>
                    Creando cuenta...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="check-circle" size={20} color="#fff" />
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={onNavigateToLogin}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta?{" "}
                <Text style={styles.linkTextBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al registrarte, aceptas nuestros{" "}
              <Text
                style={styles.terminosLink}
                onPress={() => setModalTerminosVisible(true)}
              >
                Términos y Condiciones
              </Text>
            </Text>
          </View>
          <Modal
            visible={modalTerminosVisible}
            animationType="slide"
            transparent
          >
            <View style={styles.terminosOverlay}>
              <View style={styles.terminosModal}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.terminosTitle}>
                    Términos y Condiciones
                  </Text>

                  <Text style={styles.terminosItem}>
                    1. Uso de la aplicación{"\n"}
                    El usuario se compromete a utilizar la aplicación de manera
                    responsable y conforme a la ley.
                  </Text>

                  <View style={styles.terminosDivider} />

                  <Text style={styles.terminosItem}>
                    2. Responsabilidad del usuario{"\n"}
                    El usuario es responsable de la información que ingrese y
                    del uso que haga de la aplicación.
                  </Text>

                  <View style={styles.terminosDivider} />

                  <Text style={styles.terminosItem}>
                    3. Limitación de responsabilidad{"\n"}
                    La aplicación no se hace responsable por pérdidas de datos o
                    mal uso de la información.
                  </Text>

                  <View style={styles.terminosDivider} />

                  <Text style={styles.terminosItem}>
                    4. Almacenamiento de datos{"\n"}
                    El usuario es responsable de realizar respaldos de su
                    información.
                  </Text>

                  <View style={styles.terminosDivider} />

                  <Text style={styles.terminosItem}>
                    5. Cambios en el servicio{"\n"}
                    Nos reservamos el derecho de modificar la aplicación en
                    cualquier momento.
                  </Text>

                  <View style={styles.terminosDivider} />

                  <Text style={styles.terminosItem}>
                    6. Aceptación de términos{"\n"}
                    Al registrarse, el usuario acepta estos términos y
                    condiciones.
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={styles.terminosButtonCerrar}
                  onPress={() => setModalTerminosVisible(false)}
                >
                  <Text style={styles.terminosButtonCerrarText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  eyeButton: {
    padding: 4,
  },
  inputHint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 6,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: "#93c5fd",
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  registerButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    color: "#6b7280",
    textAlign: "center",
    fontSize: 14,
  },
  linkTextBold: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },

  terminosLink: {
    color: "#3b82f6",
    fontWeight: "600",
  },

  terminosOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)", // más oscuro 🔥
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  terminosModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "85%",
  },

  terminosTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#111827",
    textAlign: "center",
  },

  terminosItem: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    paddingVertical: 10,
  },

  terminosDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  terminosButtonCerrar: {
    marginTop: 16,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  terminosButtonCerrarText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
