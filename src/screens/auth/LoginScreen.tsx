import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { getUserByEmail } from "../../services/usuarioService";
import { guardarSesion } from "../../utils/session";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}: LoginScreenProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estados para Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  // Función para mostrar toast
  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      showToast("Por favor, ingresa tu correo y contraseña", "error");
      return;
    }

    setCargando(true);
    try {
      const user = await getUserByEmail(correo.trim());
      if (!user) {
        showToast("Usuario no encontrado", "error");
        setCargando(false);
        return;
      }

      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        contrasena,
      );

      if (user.Contrasena === hashedPassword) {
        await guardarSesion(user);
        showToast(`¡Bienvenido ${user.Nombre}!`, "success");

        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else {
        showToast("Contraseña incorrecta", "error");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      showToast("Ocurrió un error al intentar iniciar sesión", "error");
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
              <Feather name="log-in" size={36} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.form}>
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
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <TouchableOpacity onPress={onNavigateToForgotPassword}>
                  <Text style={styles.forgotLink}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={18}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Tu contraseña"
                  secureTextEntry={!mostrarContrasena}
                  value={contrasena}
                  onChangeText={setContrasena}
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
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={cargando}
              style={[
                styles.loginButton,
                cargando && styles.loginButtonDisabled,
              ]}
            >
              {cargando ? (
                <View style={styles.buttonContent}>
                  <Feather name="loader" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>
                    Iniciando sesión...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="arrow-right" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={onNavigateToRegister}
              style={styles.registerBox}
            >
              <Feather name="user-plus" size={20} color="#3b82f6" />
              <View style={styles.registerTextContainer}>
                <Text style={styles.registerText}>¿No tienes cuenta?</Text>
                <Text style={styles.registerTextBold}>Regístrate aquí</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
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
    paddingTop: 100,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  forgotLink: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "500",
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
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: "#93c5fd",
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
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
  registerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 12,
  },
  registerTextContainer: {
    flex: 1,
  },
  registerText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  },
  registerTextBold: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "600",
  },
});
