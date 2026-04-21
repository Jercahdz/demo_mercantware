import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import * as Linking from "expo-linking";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

// INICIALIZAR BASE DE DATOS
import { initDatabase } from "./src/database/initDatabase";

// CONTROLAR SESIÓN
import { cerrarSesion, obtenerSesion } from "./src/utils/session";

// PANTALLAS
import HomeScreen from "./src/screens/HomeScreen";
import InvoicesScreen from "./src/screens/InvoicesScreen";
import ProductsScreen from "./src/screens/ProductScreen";
import StatsScreen from "./src/screens/StatsScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import SettingsScreen from "./src/screens/settings/SettingsSreen";

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      ResetPassword: "reset-password",
    },
  },
};

function SettingsStackScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsMain"
        options={{ headerShown: false }}
      >
        {() => <SettingsScreen onLogout={onLogout} />}
      </SettingsStack.Screen>
    </SettingsStack.Navigator>
  );
}

function Main({
  onLogout,
}: {
  onLogout: (type?: "normal" | "restore") => void;
}) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
            height: Platform.OS === "android" ? 105 : 70,
            paddingBottom: Platform.OS === "android" ? 20 : 10,
            paddingTop: 8,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: keyof typeof Feather.glyphMap = "home";

            if (route.name === "Home") iconName = "users";
            else if (route.name === "Products") iconName = "package";
            else if (route.name === "Invoices") iconName = "file-text";
            else if (route.name === "Stats") iconName = "bar-chart-2";
            else if (route.name === "Settings") iconName = "settings";

            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.iconContainerActive,
                ]}
              >
                <Feather name={iconName} size={size - 2} color={color} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarLabel: "Clientes" }}
        />
        <Tab.Screen
          name="Products"
          component={ProductsScreen}
          options={{ tabBarLabel: "Productos" }}
        />
        <Tab.Screen
          name="Invoices"
          component={InvoicesScreen}
          options={{ tabBarLabel: "Facturas" }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{ tabBarLabel: "Estadísticas" }}
        />
        <Tab.Screen name="Settings" options={{ tabBarLabel: "Ajustes" }}>
          {() => <SettingsStackScreen onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [authScreen, setAuthScreen] = useState<"login" | "register" | "forgot">(
    "login",
  );
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [logoutType, setLogoutType] = useState<"normal" | "restore">("normal");

  // VERIFICAR SESIÓN
  const checkSession = async () => {
    const sesion = await obtenerSesion();
    setIsLogged(!!sesion);
  };

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        await checkSession();
      } catch (error) {
        console.error("❌ Error al inicializar:", error);
      } finally {
        setIsReady(true);
      }
    };
    setup();
  }, []);

  // CALLBACKS DE AUTENTICACIÓN
  const handleLoginSuccess = () => setIsLogged(true);

  // LOGOUT CON MODAL PERSONALIZADO
  const handleLogout = (type: "normal" | "restore" = "normal") => {
    setLogoutType(type);
    setLogoutModalVisible(true);
  };

  // CONFIRMAR LOGOUT
  const confirmarLogout = async () => {
    try {
      console.log("🔄 Iniciando logout...");

      // CERRAR SESIÓN
      await cerrarSesion();

      console.log("✅ Sesión cerrada. Cerrando aplicación...");

      setLogoutModalVisible(false);

      // CERRAR LA APP
      BackHandler.exitApp();
    } catch (error: any) {
      console.error("Error en logout:", error);
      setLogoutModalVisible(false);
      setIsLogged(false);
      setAuthScreen("login");
    }
  };

  const handleNavigateToRegister = () => setAuthScreen("register");
  const handleNavigateToLogin = () => setAuthScreen("login");
  const handleNavigateToForgot = () => setAuthScreen("forgot");

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando aplicación...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        {isLogged ? (
          <Main onLogout={handleLogout} />
        ) : (
          <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            {/* Pantallas de autenticación */}
            {authScreen === "login" && (
              <SettingsStack.Screen name="Login">
                {() => (
                  <LoginScreen
                    onLoginSuccess={handleLoginSuccess}
                    onNavigateToRegister={handleNavigateToRegister}
                    onNavigateToForgotPassword={handleNavigateToForgot}
                  />
                )}
              </SettingsStack.Screen>
            )}

            {authScreen === "register" && (
              <SettingsStack.Screen name="Register">
                {() => (
                  <RegisterScreen onNavigateToLogin={handleNavigateToLogin} />
                )}
              </SettingsStack.Screen>
            )}

            {authScreen === "forgot" && (
              <SettingsStack.Screen name="ForgotPassword">
                {() => (
                  <ForgotPasswordScreen
                    onNavigateToLogin={handleNavigateToLogin}
                  />
                )}
              </SettingsStack.Screen>
            )}

            <SettingsStack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
            />
          </SettingsStack.Navigator>
        )}

        {/* MODAL CERRAR APP */}
        {/* MODAL CERRAR APP */}
        <Modal visible={logoutModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalConfirmar}>
              {/* ICONO DINÁMICO */}
              <View
                style={[
                  styles.modalConfirmarIcono,
                  { backgroundColor: "#dbeafe" },
                ]}
              >
                <Feather
                  name={logoutType === "restore" ? "refresh-cw" : "log-out"}
                  size={48}
                  color="#3b82f6"
                />
              </View>

              {/* TÍTULO */}
              <Text style={styles.modalConfirmarTitulo}>
                {logoutType === "restore"
                  ? "Restauración Completa"
                  : "¿Cerrar sesión?"}
              </Text>

              {/* TEXTO */}
              <Text style={styles.modalConfirmarTexto}>
                {logoutType === "restore"
                  ? "La restauración se completó correctamente. Para aplicar todos los cambios, la aplicación debe reiniciarse."
                  : "¿Estás seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta."}
              </Text>

              {/* BOTONES */}
              <View style={styles.modalConfirmarBotones}>
                {/* BOTÓN CANCELAR (solo en logout normal) */}
                {logoutType === "normal" && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setLogoutModalVisible(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                )}

                {/* BOTÓN PRINCIPAL */}
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#3b82f6" }]}
                  onPress={confirmarLogout}
                >
                  <Text
                    style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                  >
                    {logoutType === "restore" ? "Reiniciar" : "Cerrar sesión"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 36,
    borderRadius: 12,
  },
  iconContainerActive: {
    backgroundColor: "#eff6ff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  modalButtonLogout: {
    backgroundColor: "#ef4444",
  },
  modalButtonLogoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
