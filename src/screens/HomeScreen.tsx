import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomToast from "../components/Toast";
import {
  deleteCliente,
  getClientes,
  getUltimasFacturasByCliente,
  insertCliente,
  updateCliente,
} from "../services/clienteService";

export default function HomeScreen() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteActual, setClienteActual] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [facturas, setFacturas] = useState<{ [key: number]: any[] }>({});
  const [loadingFacturas, setLoadingFacturas] = useState<number | null>(null);

  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [correoCliente, setCorreoCliente] = useState("");

  // Estados para Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  // Modal de confirmación
  const [modalConfirmarVisible, setModalConfirmarVisible] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState<number | null>(null);

  // Función para mostrar toast
  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error("❌ Error cargando clientes:", error);
      showToast("Error al cargar los clientes", "error");
    }
  };

  const cargarFacturas = async (idCliente: number) => {
    try {
      setLoadingFacturas(idCliente);
      const facturasCliente = await getUltimasFacturasByCliente(idCliente);
      setFacturas((prev) => ({
        ...prev,
        [idCliente]: facturasCliente,
      }));
    } catch (error) {
      console.error("❌ Error cargando facturas:", error);
      showToast("No se pudieron cargar las facturas", "error");
    } finally {
      setLoadingFacturas(null);
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!facturas[id]) {
        await cargarFacturas(id);
      }
    }
  };

  const abrirModal = (cliente?: any) => {
    if (cliente) {
      setClienteActual(cliente);
      setNombreCliente(cliente.nombre);
      setTelefonoCliente(cliente.telefono);
      setCorreoCliente(cliente.correo || "");
    } else {
      setClienteActual(null);
      setNombreCliente("");
      setTelefonoCliente("");
      setCorreoCliente("");
    }
    setModalVisible(true);
  };

  const validarFormulario = (): boolean => {
    // Validar nombre
    if (!nombreCliente.trim()) {
      showToast("El nombre es obligatorio", "error");
      return false;
    }

    if (nombreCliente.trim().length < 3) {
      showToast("El nombre debe tener al menos 3 caracteres", "error");
      return false;
    }

    // Validar que el nombre
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/;
    if (!nombreRegex.test(nombreCliente.trim())) {
      showToast("El nombre solo debe contener letras", "error");
      return false;
    }

    // Validar teléfono obligatorio
    if (!telefonoCliente.trim()) {
      showToast("El teléfono es obligatorio", "error");
      return false;
    }

    // Limpiar teléfono (quitar espacios, guiones, paréntesis)
    const telefonoLimpio = telefonoCliente.replace(/[\s\-()]/g, "");

    // Validar formato internacional básico
    if (!/^\+?\d{7,15}$/.test(telefonoLimpio)) {
      showToast("Ingresa un teléfono válido", "error");
      return false;
    }

    // Validar correo (opcional, pero si se ingresa debe ser válido)
    if (correoCliente.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoCliente.trim())) {
        showToast("Ingresa un correo electrónico válido", "error");
        return false;
      }
    }

    return true;
  };

  const guardarCliente = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      if (clienteActual) {
        await updateCliente(
          clienteActual.id,
          nombreCliente.trim(),
          telefonoCliente.trim(),
          correoCliente.trim(),
        );
        showToast("Cliente actualizado correctamente", "success");
      } else {
        await insertCliente(
          nombreCliente.trim(),
          telefonoCliente.trim(),
          correoCliente.trim(),
        );
        showToast("Cliente creado correctamente", "success");
      }

      setModalVisible(false);
      setClienteActual(null);
      setNombreCliente("");
      setTelefonoCliente("");
      setCorreoCliente("");
      await cargarClientes();
    } catch (error) {
      console.error("❌ Error guardando cliente:", error);
      showToast("Error al guardar el cliente", "error");
    }
  };

  const confirmarEliminar = (id: number) => {
    setClienteAEliminar(id);
    setModalConfirmarVisible(true);
  };

  const eliminarCliente = async () => {
    if (!clienteAEliminar) return;

    try {
      await deleteCliente(clienteAEliminar);
      const nuevasFacturas = { ...facturas };
      delete nuevasFacturas[clienteAEliminar];
      setFacturas(nuevasFacturas);
      await cargarClientes();
      showToast("Cliente eliminado correctamente", "success");
    } catch (error) {
      console.error("❌ Error eliminando cliente:", error);
      showToast("Error al eliminar el cliente", "error");
    } finally {
      setModalConfirmarVisible(false);
      setClienteAEliminar(null);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "activo":
        return "#10b981";
      case "inactivo":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderCliente = ({ item }: any) => {
    const facturasCliente = facturas[item.id] || [];
    const isLoading = loadingFacturas === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.clienteHeader}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.clienteInfoContainer}>
            <Text style={styles.clienteNombre}>{item.nombre}</Text>
            <View style={styles.infoRow}>
              <Feather name="phone" size={12} color="#6b7280" />
              <Text style={styles.clienteInfo}>{item.telefono}</Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="mail" size={12} color="#6b7280" />
              <Text style={styles.clienteInfo}>
                {item.correo || "Sin correo"}
              </Text>
            </View>
          </View>
          <View style={styles.clienteActions}>
            <Feather
              name={expandedId === item.id ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6b7280"
            />
          </View>
        </TouchableOpacity>

        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <View style={styles.facturasHeader}>
              <Text style={styles.facturasTitle}>Últimas facturas</Text>
            </View>

            <View style={styles.facturasContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.loadingText}>Cargando facturas...</Text>
                </View>
              ) : facturasCliente.length > 0 ? (
                facturasCliente.map((factura, index) => {
                  const numeroFactura = `INV-${String(
                    factura.IdFactura,
                  ).padStart(3, "0")}`;

                  return (
                    <View
                      key={factura.IdFactura}
                      style={[
                        styles.facturaItemSimple,
                        index === facturasCliente.length - 1 &&
                          styles.lastFacturaItem,
                      ]}
                    >
                      <View style={styles.facturaLeft}>
                        <Text style={styles.facturaNumero}>
                          {numeroFactura}
                        </Text>
                        <View style={styles.infoRowSmall}>
                          <Feather name="calendar" size={11} color="#9ca3af" />
                          <Text style={styles.facturaFecha}>
                            {formatearFecha(factura.Fecha)}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.estadoBadgeSmall,
                          {
                            backgroundColor:
                              getEstadoColor(factura.Estado) + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.estadoTextSmall,
                            { color: getEstadoColor(factura.Estado) },
                          ]}
                        >
                          {factura.Estado === "Activo" ? "PAGADA" : "VENCIDA"}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.sinFacturas}>Sin facturas asociadas</Text>
              )}
            </View>

            <View style={styles.clienteActionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => abrirModal(item)}
              >
                <Feather name="edit-3" size={14} color="#374151" />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => confirmarEliminar(item.id)}
              >
                <Feather name="trash-2" size={14} color="#991b1b" />
                <Text style={styles.actionButtonTextDanger}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {/* Toast Component */}
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Clientes</Text>
            <Text style={styles.headerSubtitle}>
              Gestiona tu cartera de clientes
            </Text>
          </View>

          {/* Btn Nuevo Cliente */}
          <TouchableOpacity
            style={styles.newClientButton}
            onPress={() => abrirModal()}
          >
            <Feather name="user-plus" size={18} color="#fff" />
            <Text style={styles.newClientButtonText}>Nuevo Cliente</Text>
          </TouchableOpacity>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Lista de Clientes */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              Mostrando {filteredClientes.length} de {clientes.length} clientes
            </Text>
            <FlatList
              data={filteredClientes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCliente}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
          {filteredClientes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No hay clientes</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? "No se encontraron clientes con ese nombre"
                  : "Agrega tu primer cliente"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredClientes}
              renderItem={renderCliente}
              keyExtractor={(item) => item.IdCliente.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </ScrollView>

        {/* Modal agregar/editar */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          {/* Toast Component */}
          <CustomToast
            visible={toastVisible}
            message={toastMessage}
            type={toastType}
            onHide={() => setToastVisible(false)}
          />
          <View style={styles.modalFondo}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Feather
                  name={clienteActual ? "edit-3" : "user-plus"}
                  size={24}
                  color="#3b82f6"
                />
                <Text style={styles.modalTitulo}>
                  {clienteActual ? "Editar Cliente" : "Nuevo Cliente"}
                </Text>
              </View>
              <Text style={styles.modalSubtitulo}>
                {clienteActual
                  ? "Actualiza la información del cliente"
                  : "Ingresa los datos del nuevo cliente"}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre del cliente *</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del cliente"
                    value={nombreCliente}
                    onChangeText={setNombreCliente}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="phone" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ingresa el teléfono"
                    keyboardType="phone-pad"
                    value={telefonoCliente}
                    onChangeText={setTelefonoCliente}
                    placeholderTextColor="#9ca3af"
                    maxLength={9}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Correo electrónico</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder="nombre@dominio.com"
                    keyboardType="email-address"
                    value={correoCliente}
                    onChangeText={setCorreoCliente}
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  onPress={guardarCliente}
                >
                  <Text style={styles.modalBtnSaveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Confirmar Eliminación */}
        <Modal visible={modalConfirmarVisible} animationType="fade" transparent>
          <View style={styles.modalFondo}>
            <View style={styles.modalConfirmar}>
              <View style={styles.modalConfirmarIcono}>
                <Feather name="alert-triangle" size={48} color="#f59e0b" />
              </View>
              <Text style={styles.modalConfirmarTitulo}>
                ¿Eliminar cliente?
              </Text>
              <Text style={styles.modalConfirmarTexto}>
                Esta acción no se puede deshacer. El cliente será eliminado
                permanentemente.
              </Text>
              <View style={styles.modalConfirmarBotones}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setModalConfirmarVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnEliminar]}
                  onPress={eliminarCliente}
                >
                  <Text style={styles.modalBtnEliminarText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },

  emptySubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },

  modalConfirmar: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalConfirmarIcono: {
    marginBottom: 16,
  },
  modalConfirmarTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  modalConfirmarTexto: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalConfirmarBotones: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnEliminar: {
    backgroundColor: "#ef4444",
  },
  modalBtnEliminarText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollView: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    marginTop: 8,
  },
  headerSubtitle: { fontSize: 14, color: "#6b7280" },
  newClientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newClientButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  listTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
    fontWeight: "500",
  },
  listContent: { gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
  },
  clienteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },
  clienteInfoContainer: { flex: 1 },
  clienteNombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  clienteInfo: {
    fontSize: 13,
    color: "#6b7280",
  },
  clienteActions: { marginLeft: 12 },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  facturasHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#f9fafb",
  },
  facturasTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  facturasContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  facturaItemSimple: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  lastFacturaItem: {
    borderBottomWidth: 0,
  },
  facturaLeft: {
    flex: 1,
  },
  facturaNumero: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  infoRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  facturaFecha: {
    fontSize: 12,
    color: "#9ca3af",
  },
  estadoBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  estadoTextSmall: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sinFacturas: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  clienteActionButtons: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  actionButtonDanger: {
    backgroundColor: "#fee2e2",
  },
  actionButtonText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  actionButtonTextDanger: {
    fontSize: 13,
    color: "#991b1b",
    fontWeight: "500",
  },
  modalFondo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  modalSubtitulo: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  modalBotones: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalBtnSave: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  modalBtnSaveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
