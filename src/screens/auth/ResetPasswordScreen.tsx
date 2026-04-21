import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import CustomToast from "../../components/Toast";
import {
  updatePasswordWithToken,
  verifyToken,
} from "../../services/usuarioService";

export default function ResetPasswordScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();

  const token = route.params?.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  const showToast = (msg: string, type: typeof toastType) => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        showToast("Token inválido", "error");
        return;
      }

      const isValid = await verifyToken(token);

      if (!isValid) {
        showToast("El enlace ha expirado o es inválido", "error");
      }
    };

    checkToken();
  }, []);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showToast("Completa todos los campos", "error");
      return;
    }

    if (password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    setLoading(true);

    try {
      await updatePasswordWithToken(token, password);

      showToast("Contraseña actualizada correctamente", "success");

      setTimeout(() => {
        navigation.navigate("Login" as never);
      }, 2000);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar la contraseña", "error");
    } finally {
      setLoading(false);
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

      <View style={styles.container}>
        <View style={styles.header}>
          <Feather name="lock" size={40} color="#3b82f6" />
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Ingresa tu nueva contraseña</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Nueva contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TextInput
            placeholder="Confirmar contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleResetPassword}
            style={styles.button}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
});
