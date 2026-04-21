// src/screens/InvoicesScreen.tsx
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomToast from "../components/Toast";
import { getClientes } from "../services/clienteService";
import {
  calcularVencimiento,
  exportInvoicePDF,
  formatDate,
  guardarConfigEmpresa,
  mapEstadoUI,
  obtenerConfigEmpresa,
} from "../services/invoiceExport";
import {
  getEstadisticas,
  getFacturaById,
  getFacturas,
  insertFactura,
} from "../services/invoicesService";
import { getProducts } from "../services/productService";

type ProductoCarrito = {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export default function InvoicesScreen() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    montoTotal: 0,
    activas: 0,
    inactivas: 0,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState("");
  const [tipo, setTipo] = useState<"Contado" | "Credito">("Contado");
  const [estado, setEstado] = useState<"Activo" | "Inactivo">("Activo");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);

  const [modalClientesVisible, setModalClientesVisible] = useState(false);
  const [modalProductosVisible, setModalProductosVisible] = useState(false);
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState<any>(null);

  const [modalExportVisible, setModalExportVisible] = useState(false);

  const [empresaNombre, setEmpresaNombre] = useState("");
  const [empresaCedula, setEmpresaCedula] = useState("");
  const [empresaDireccion, setEmpresaDireccion] = useState("");
  const [empresaTelefono, setEmpresaTelefono] = useState("");
  const [empresaEmail, setEmpresaEmail] = useState("");

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<number | null>(
    null,
  );

  const [clienteCedula, setClienteCedula] = useState("");

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

  // Búsqueda dentro de los modales selector
  const [searchCliente, setSearchCliente] = useState("");
  const [searchProducto, setSearchProducto] = useState("");

  useEffect(() => {
    const setupDB = async () => {
      await cargarFacturas();
      await cargarClientes();
      await cargarProductos();

      const config = await obtenerConfigEmpresa();
      setEmpresaNombre(config.empresaNombre || "");
      setEmpresaCedula(config.empresaCedula || "");
      setEmpresaDireccion(config.empresaDireccion || "");
      setEmpresaTelefono(config.empresaTelefono || "");
      setEmpresaEmail(config.empresaEmail || "");
    };

    setupDB();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarClientes();
      cargarProductos();
    }, []),
  );

  const cargarFacturas = async () => {
    try {
      const data = await getFacturas();
      setFacturas(data);
      const estadisticas = await getEstadisticas();
      setStats(estadisticas);
    } catch (error) {
      console.error("❌ Error cargando facturas:", error);
    }
  };

  const cargarClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error("❌ Error cargando clientes:", error);
    }
  };

  const cargarProductos = async () => {
    try {
      const data = await getProducts();
      setProductos(data);
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarFacturas();
    setRefreshing(false);
  };

  const abrirModal = () => {
    limpiarFormulario();
    setClienteCedula("");
    setModalVisible(true);
  };

  const abrirModalVer = async (factura: any) => {
    try {
      const detalle = await getFacturaById(factura.IdFactura);
      setFacturaDetalle(detalle);
      setModalVerVisible(true);
    } catch (error) {
      console.error("❌ Error obteniendo detalle:", error);
      showToast("No se pudo cargar el detalle de la factura", "error");
    }
  };

  const limpiarFormulario = () => {
    setClienteSeleccionado("");
    setProductoSeleccionado("");
    setCantidadProducto("");
    setTipo("Contado");
    setEstado("Activo");
    setFecha(new Date().toISOString().split("T")[0]);
    setCarrito([]);
    setSearchCliente("");
    setSearchProducto("");
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado || !cantidadProducto) {
      showToast("Selecciona un producto y define la cantidad", "warning");
      return;
    }
    const producto = productos.find(
      (p) => p.IdProducto.toString() === productoSeleccionado,
    );
    if (!producto) return;

    const cantidad = parseInt(cantidadProducto);
    if (cantidad <= 0) {
      showToast("La cantidad debe ser mayor a 0", "warning");
      return;
    }
    const productoExistente = carrito.find(
      (p) => p.idProducto === producto.IdProducto,
    );
    if (productoExistente) {
      showToast("Este producto ya está en el carrito", "warning");
      return;
    }
    const nuevoProducto: ProductoCarrito = {
      idProducto: producto.IdProducto,
      nombre: producto.Nombre,
      cantidad,
      precioUnitario: producto.Precio,
      subtotal: cantidad * producto.Precio,
    };
    setCarrito([...carrito, nuevoProducto]);
    setProductoSeleccionado("");
    setCantidadProducto("");
  };

  const eliminarDelCarrito = (idProducto: number) => {
    setCarrito(carrito.filter((p) => p.idProducto !== idProducto));
  };

  const calcularTotalCarrito = () =>
    carrito.reduce((sum, p) => sum + p.subtotal, 0);

  const guardarFactura = async () => {
    if (!clienteSeleccionado) {
      showToast("Selecciona un cliente", "warning");
      return;
    }
    if (carrito.length === 0) {
      showToast("Agrega al menos un producto al carrito", "warning");
      return;
    }
    try {
      const productosParaInsertar = carrito.map((p) => ({
        idProducto: p.idProducto,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
      }));
      await insertFactura(
        fecha,
        tipo,
        estado,
        parseInt(clienteSeleccionado),
        productosParaInsertar,
      );
      showToast("Factura creada correctamente", "success");
      setModalVisible(false);
      limpiarFormulario();
      await cargarFacturas();
    } catch (error) {
      console.error("❌ Error guardando factura:", error);
      showToast("No se pudo guardar la factura", "error");
    }
  };

  const getStatusColor = (estado: string) => {
    if (estado === "Activo") {
      return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
    }
    return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
  };

  const filteredFacturas = facturas.filter((factura) => {
    const matchesSearch =
      factura.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `INV-${String(factura.IdFactura).padStart(3, "0")}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "pagada" && factura.Estado === "Activo") ||
      (statusFilter === "vencida" && factura.Estado === "Inactivo");
    return matchesSearch && matchesStatus;
  });

  const facturasPagadas = facturas.filter(
    (inv) => inv.Estado === "Activo",
  ).length;
  const facturasVencidas = facturas.filter(
    (inv) => inv.Estado === "Inactivo",
  ).length;
  const totalMonto = facturas.reduce((sum, inv) => sum + (inv.Total ?? 0), 0);

  const clienteNombreSeleccionado = clienteSeleccionado
    ? clientes.find((c) => c.id.toString() === clienteSeleccionado)?.nombre
    : null;

  const productoNombreSeleccionado = productoSeleccionado
    ? productos.find((p) => p.IdProducto.toString() === productoSeleccionado)
        ?.Nombre
    : null;

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(searchCliente.toLowerCase()),
  );

  const productosFiltrados = productos.filter((p) =>
    p.Nombre.toLowerCase().includes(searchProducto.toLowerCase()),
  );

  const generarFactura = async () => {
    if (!facturaSeleccionada) {
      showToast("Selecciona una factura", "warning");
      return;
    }

    await guardarConfigEmpresa({
      empresaNombre,
      empresaCedula,
      empresaDireccion,
      empresaTelefono,
      empresaEmail,
    });

    await exportInvoicePDF(facturaSeleccionada, {
      empresaNombre,
      empresaCedula,
      empresaDireccion,
      empresaTelefono,
      empresaEmail,
      clienteCedula,
    });

    setModalExportVisible(false);

    showToast("Factura generada correctamente", "success");
  };

  const renderFactura = ({ item }: any) => {
    const statusColors = getStatusColor(item.Estado);
    const numeroFactura = `INV-${String(item.IdFactura).padStart(3, "0")}`;
    const total = item.Total ?? 0;

    return (
      <View style={styles.invoiceCard}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceIdContainer}>
            <Text style={styles.invoiceId}>{numeroFactura}</Text>
            <Text style={styles.invoiceProducts}>
              {item.cantidadProductos || 0} productos
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColors.bg,
                borderColor: statusColors.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {mapEstadoUI(item.Estado)}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceBody}>
          <Text style={styles.clientName}>
            {item.clienteNombre || "Cliente sin nombre"}
          </Text>
          <Text style={styles.clientEmail}>
            {item.clienteCorreo || "Sin correo"}
          </Text>
          <View style={styles.invoiceDates}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Fecha:</Text>
              <Text style={styles.dateValue}>{formatDate(item.Fecha)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Vence:</Text>
              <Text style={styles.dateValue}>
                {calcularVencimiento(item.Fecha, item.Tipo)}
              </Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Monto Total</Text>
            <Text style={styles.amountValue}>
              ₡{total.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceActions}>
          {/* DESCARGAR PDF */}
          <TouchableOpacity
            style={[styles.invoiceBtn, styles.invoiceBtnPrimary]}
            onPress={() => {
              setFacturaSeleccionada(item.IdFactura);
              setClienteCedula("");
              setModalExportVisible(true);
            }}
          >
            <Feather name="download" size={16} color="#fff" />
            <Text style={styles.invoiceBtnPrimaryText}>Descargar</Text>
          </TouchableOpacity>

          {/* VER DETALLE */}
          <TouchableOpacity
            style={[styles.invoiceBtn, styles.invoiceBtnSecondary]}
            onPress={() => abrirModalVer(item)}
          >
            <Feather name="eye" size={16} color="#374151" />
            <Text style={styles.invoiceBtnSecondaryText}>Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProductoCarrito = ({ item }: { item: ProductoCarrito }) => (
    <View style={styles.carritoItem}>
      <View style={styles.carritoItemInfo}>
        <Text style={styles.carritoItemNombre}>{item.nombre}</Text>
        <Text style={styles.carritoItemDetalle}>
          {item.cantidad} x ₡
          {(item.precioUnitario ?? 0).toLocaleString("es-CR")}
        </Text>
      </View>
      <View style={styles.carritoItemAcciones}>
        <Text style={styles.carritoItemSubtotal}>
          ₡{(item.subtotal ?? 0).toLocaleString("es-CR")}
        </Text>
        <TouchableOpacity
          style={styles.carritoItemEliminar}
          onPress={() => eliminarDelCarrito(item.idProducto)}
        >
          <Feather name="trash-2" size={14} color="#991b1b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Facturas</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona y monitorea todas tus facturas
          </Text>
        </View>

        <TouchableOpacity style={styles.newInvoiceButton} onPress={abrirModal}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.newInvoiceButtonText}>Nueva Factura</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar facturas..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {["todos", "pagada", "vencida"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                statusFilter === f && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(f)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === f && styles.filterButtonTextActive,
                ]}
              >
                {f === "todos"
                  ? "Todos"
                  : f === "pagada"
                    ? "Pagadas"
                    : "Vencidas"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            {" "}
            Mostrando {filteredFacturas.length} de {facturas.length}{" "}
            facturas{" "}
          </Text>
        </View>

        {filteredFacturas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No hay facturas</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm || statusFilter !== "todos"
                ? "No se encontraron resultados con los filtros aplicados"
                : "Comienza creando tu primera factura"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFacturas}
            renderItem={renderFactura}
            keyExtractor={(item) => item.IdFactura.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ScrollView>

      {/* ─── MODAL CREAR FACTURA ─── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <CustomToast
            visible={toastVisible}
            message={toastMessage}
            type={toastType}
            onHide={() => setToastVisible(false)}
          />
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Feather name="file-plus" size={24} color="#3b82f6" />
                <Text style={styles.modalTitulo}>Nueva Factura</Text>
              </View>
              <Text style={styles.modalSubtitulo}>
                Agrega productos al carrito y completa la información
              </Text>

              {/* Cliente */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cliente *</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setModalClientesVisible(true)}
                >
                  <Feather name="user" size={16} color="#9ca3af" />
                  <Text
                    style={[
                      styles.inputSelectorText,
                      clienteNombreSeleccionado &&
                        styles.inputSelectorTextSelected,
                    ]}
                  >
                    {clienteNombreSeleccionado ?? "Seleccionar cliente"}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Separador sección agregar productos */}
              <View style={styles.seccionSeparador}>
                <Feather name="package" size={16} color="#3b82f6" />
                <Text style={styles.seccionTitulo}>Agregar Productos</Text>
              </View>

              {/* Producto */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Producto</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setModalProductosVisible(true)}
                >
                  <Feather name="box" size={16} color="#9ca3af" />
                  <Text
                    style={[
                      styles.inputSelectorText,
                      productoNombreSeleccionado &&
                        styles.inputSelectorTextSelected,
                    ]}
                  >
                    {productoNombreSeleccionado ?? "Seleccionar producto"}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Cantidad */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cantidad</Text>
                <View style={styles.cantidadRow}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <Feather name="hash" size={16} color="#9ca3af" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: 5"
                      keyboardType="numeric"
                      value={cantidadProducto}
                      onChangeText={setCantidadProducto}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.btnAgregarCarrito}
                    onPress={agregarAlCarrito}
                  >
                    <Feather name="plus" size={16} color="#fff" />
                    <Text style={styles.btnAgregarCarritoText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Carrito */}
              {carrito.length > 0 && (
                <View style={styles.carritoContainer}>
                  <View style={styles.carritoHeaderRow}>
                    <Feather name="shopping-cart" size={15} color="#3b82f6" />
                    <Text style={styles.carritoTitle}>
                      Carrito ({carrito.length}{" "}
                      {carrito.length === 1 ? "producto" : "productos"})
                    </Text>
                  </View>
                  <FlatList
                    data={carrito}
                    renderItem={renderProductoCarrito}
                    keyExtractor={(item) => item.idProducto.toString()}
                    scrollEnabled={false}
                  />
                  <View style={styles.carritoTotal}>
                    <Text style={styles.carritoTotalLabel}>Total:</Text>
                    <Text style={styles.carritoTotalValue}>
                      ₡
                      {calcularTotalCarrito().toLocaleString("es-CR", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tipo de pago */}
              <View style={styles.seccionSeparador}>
                <Feather name="credit-card" size={16} color="#3b82f6" />
                <Text style={styles.seccionTitulo}>Tipo de Pago</Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.radioGroup}>
                  {(["Contado", "Credito"] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.radioButton,
                        tipo === t && styles.radioButtonActive,
                      ]}
                      onPress={() => setTipo(t)}
                    >
                      <Text
                        style={[
                          styles.radioButtonText,
                          tipo === t && styles.radioButtonTextActive,
                        ]}
                      >
                        {t === "Contado" ? "Contado" : "Crédito (30 días)"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Estado */}
              <View style={styles.seccionSeparador}>
                <Feather name="toggle-left" size={16} color="#3b82f6" />
                <Text style={styles.seccionTitulo}>Estado</Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.radioGroup}>
                  {(["Activo", "Inactivo"] as const).map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[
                        styles.radioButton,
                        estado === e && styles.radioButtonActive,
                      ]}
                      onPress={() => setEstado(e)}
                    >
                      <Text
                        style={[
                          styles.radioButtonText,
                          estado === e && styles.radioButtonTextActive,
                        ]}
                      >
                        {e}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Botones */}
              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => {
                    setModalVisible(false);
                    limpiarFormulario();
                  }}
                >
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  onPress={guardarFactura}
                >
                  <Text style={styles.modalBtnSaveText}>Crear Factura</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL SELECCIONAR CLIENTE ─── */}
      <Modal visible={modalClientesVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalSelectorContainer}>
            <View style={styles.modalSelectorHeader}>
              <View style={styles.modalSelectorHeaderLeft}>
                <Feather name="user" size={20} color="#3b82f6" />
                <Text style={styles.modalSelectorTitle}>
                  Seleccionar Cliente
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalClientesVisible(false)}>
                <Feather name="x" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Búsqueda */}
            <View style={styles.selectorSearch}>
              <Feather name="search" size={16} color="#9ca3af" />
              <TextInput
                style={styles.selectorSearchInput}
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChangeText={setSearchCliente}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView style={styles.selectorList}>
              {clientesFiltrados.map((cliente, index) => (
                <TouchableOpacity
                  key={cliente.id}
                  style={[
                    styles.selectorItem,
                    clienteSeleccionado === cliente.id.toString() &&
                      styles.selectorItemActive,
                    index === clientesFiltrados.length - 1 &&
                      styles.selectorLastItem,
                  ]}
                  onPress={() => {
                    setClienteSeleccionado(cliente.id.toString());
                    setSearchCliente("");
                    setModalClientesVisible(false);
                  }}
                >
                  <View style={styles.selectorItemContent}>
                    <Text style={styles.selectorItemTitle}>
                      {cliente.nombre}
                    </Text>
                    <View style={styles.selectorItemRow}>
                      <Feather name="mail" size={12} color="#9ca3af" />
                      <Text style={styles.selectorItemSub}>
                        {cliente.correo || "Sin correo"}
                      </Text>
                    </View>
                    <View style={styles.selectorItemRow}>
                      <Feather name="phone" size={12} color="#9ca3af" />
                      <Text style={styles.selectorItemSub}>
                        {cliente.telefono}
                      </Text>
                    </View>
                  </View>
                  {clienteSeleccionado === cliente.id.toString() && (
                    <Feather name="check-circle" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
              {clientesFiltrados.length === 0 && (
                <Text style={styles.selectorEmpty}>
                  No se encontraron clientes
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL SELECCIONAR PRODUCTO ─── */}
      <Modal visible={modalProductosVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalSelectorContainer}>
            <View style={styles.modalSelectorHeader}>
              <View style={styles.modalSelectorHeaderLeft}>
                <Feather name="box" size={20} color="#3b82f6" />
                <Text style={styles.modalSelectorTitle}>
                  Seleccionar Producto
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalProductosVisible(false)}>
                <Feather name="x" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Búsqueda */}
            <View style={styles.selectorSearch}>
              <Feather name="search" size={16} color="#9ca3af" />
              <TextInput
                style={styles.selectorSearchInput}
                placeholder="Buscar producto..."
                value={searchProducto}
                onChangeText={setSearchProducto}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView style={styles.selectorList}>
              {productosFiltrados.map((producto, index) => (
                <TouchableOpacity
                  key={producto.IdProducto}
                  style={[
                    styles.selectorItem,
                    productoSeleccionado === producto.IdProducto.toString() &&
                      styles.selectorItemActive,
                    index === productosFiltrados.length - 1 &&
                      styles.selectorLastItem,
                  ]}
                  onPress={() => {
                    setProductoSeleccionado(producto.IdProducto.toString());
                    setSearchProducto("");
                    setModalProductosVisible(false);
                  }}
                >
                  <View style={styles.selectorItemContent}>
                    <Text style={styles.selectorItemTitle}>
                      {producto.Nombre}
                    </Text>
                    <View style={styles.selectorItemRow}>
                      <Feather name="tag" size={12} color="#9ca3af" />
                      <Text style={styles.selectorItemSub}>
                        ₡{producto.Precio.toLocaleString()} · Stock:{" "}
                        {producto.Cantidad}
                      </Text>
                    </View>
                    <View style={styles.selectorItemRow}>
                      <Feather name="grid" size={12} color="#9ca3af" />
                      <Text style={styles.selectorItemSub}>
                        {producto.Categoria}
                      </Text>
                    </View>
                  </View>
                  {productoSeleccionado === producto.IdProducto.toString() && (
                    <Feather name="check-circle" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
              {productosFiltrados.length === 0 && (
                <Text style={styles.selectorEmpty}>
                  No se encontraron productos
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL VER DETALLES ─── */}
      <Modal visible={modalVerVisible} animationType="fade" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* HEADER */}
              <View style={styles.modalSelectorHeader}>
                <View style={styles.modalSelectorHeaderLeft}>
                  <Feather name="file-text" size={20} color="#3b82f6" />
                  <Text style={styles.modalSelectorTitle}>
                    {facturaDetalle
                      ? `INV-${String(facturaDetalle.IdFactura).padStart(3, "0")}`
                      : "Detalle de Factura"}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setModalVerVisible(false)}>
                  <Feather name="x" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitulo}>
                Información completa de la factura
              </Text>

              {facturaDetalle && (
                <View style={styles.detailsContainer}>
                  {/* CLIENTE */}
                  <View style={styles.seccionSeparador}>
                    <Feather name="user" size={16} color="#3b82f6" />
                    <Text style={styles.seccionTitulo}>Cliente</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardValue}>
                      {facturaDetalle.clienteNombre}
                    </Text>
                    <Text style={styles.detailCardSubvalue}>
                      {facturaDetalle.clienteCorreo || "Sin correo"}
                    </Text>
                    <Text style={styles.detailCardSubvalue}>
                      📞 {facturaDetalle.clienteTelefono || "Sin teléfono"}
                    </Text>
                  </View>

                  {/* PRODUCTOS */}
                  <View style={styles.seccionSeparador}>
                    <Feather name="package" size={16} color="#3b82f6" />
                    <Text style={styles.seccionTitulo}>Productos</Text>
                  </View>

                  <View style={styles.detailCard}>
                    {facturaDetalle.productos?.map(
                      (prod: any, index: number) => (
                        <View key={index} style={styles.productoDetalleItem}>
                          <Text style={styles.productoDetalleNombre}>
                            {prod.productoNombre || "Sin nombre"}
                          </Text>
                          <Text style={styles.productoDetalleInfo}>
                            {prod.Cantidad ?? 0} x ₡
                            {(prod.PrecioUnitario ?? 0).toLocaleString("es-CR")}{" "}
                            = ₡{(prod.Subtotal ?? 0).toLocaleString("es-CR")}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>

                  {/* FECHAS */}
                  <View style={styles.seccionSeparador}>
                    <Feather name="calendar" size={16} color="#3b82f6" />
                    <Text style={styles.seccionTitulo}>Fechas</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardSubvalue}>
                      Emisión: {formatDate(facturaDetalle.Fecha)}
                    </Text>
                    <Text style={styles.detailCardSubvalue}>
                      Vencimiento:{" "}
                      {calcularVencimiento(
                        facturaDetalle.Fecha,
                        facturaDetalle.Tipo,
                      )}
                    </Text>
                    <Text style={styles.detailCardSubvalue}>
                      Estado: {mapEstadoUI(facturaDetalle.Estado)}
                    </Text>
                  </View>

                  {/* TOTAL */}
                  <View style={styles.seccionSeparador}>
                    <Feather name="dollar-sign" size={16} color="#3b82f6" />
                    <Text style={styles.seccionTitulo}>Total</Text>
                  </View>

                  <View style={[styles.detailCard, styles.detailCardTotal]}>
                    <Text style={styles.detailTotalValue}>
                      ₡
                      {(facturaDetalle.Total ?? 0).toLocaleString("es-CR", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(facturaDetalle.Estado)
                            .bg,
                          borderColor: getStatusColor(facturaDetalle.Estado)
                            .border,
                          marginTop: 12,
                          alignSelf: "center",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(facturaDetalle.Estado).text },
                        ]}
                      >
                        {mapEstadoUI(facturaDetalle.Estado)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* BOTÓN */}
              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setModalVerVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL MODIFICAR FACTURA */}
      <Modal visible={modalExportVisible} animationType="fade" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* HEADER */}
              <View style={styles.modalHeader}>
                <Feather name="file-text" size={24} color="#3b82f6" />
                <Text style={styles.modalTitulo}>Configurar Factura</Text>
              </View>

              <Text style={styles.modalSubtitulo}>
                Completa la información para generar la factura PDF
              </Text>

              {/* EMPRESA */}
              <View style={styles.seccionSeparador}>
                <Feather name="briefcase" size={16} color="#3b82f6" />
                <Text style={styles.seccionTitulo}>Datos de la Empresa</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={empresaNombre}
                    onChangeText={setEmpresaNombre}
                    placeholder="Nombre empresa"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cédula Jurídica</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={empresaCedula}
                    onChangeText={setEmpresaCedula}
                    placeholder="Ej: 3-101-123456"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Dirección</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={empresaDireccion}
                    onChangeText={setEmpresaDireccion}
                    placeholder="Dirección"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Teléfono</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={empresaTelefono}
                    onChangeText={setEmpresaTelefono}
                    placeholder="Teléfono"
                    keyboardType="phone-pad"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={empresaEmail}
                    onChangeText={setEmpresaEmail}
                    placeholder="correo@empresa.com"
                    keyboardType="email-address"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* CLIENTE */}
              <View style={styles.seccionSeparador}>
                <Feather name="user" size={16} color="#3b82f6" />
                <Text style={styles.seccionTitulo}>Datos del Cliente</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    value={
                      facturas.find((f) => f.IdFactura === facturaSeleccionada)
                        ?.clienteNombre || ""
                    }
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cédula jurídica</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="credit-card" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    value={clienteCedula}
                    onChangeText={setClienteCedula}
                    placeholder="Cédula cliente"
                  />
                </View>
              </View>

              {/* BOTONES */}
              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setModalExportVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  onPress={generarFactura}
                >
                  <Text style={styles.modalBtnSaveText}>Generar PDF</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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

  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },

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

  listContent: {
    paddingTop: 8,
  },

  newInvoiceButton: {
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
  newInvoiceButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

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

  filtersContainer: { paddingHorizontal: 20, marginBottom: 16 },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButtonActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  filterButtonText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  filterButtonTextActive: { color: "#fff" },

  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  listTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
    fontWeight: "500",
  },

  emptyText: { fontSize: 64, marginBottom: 16 },

  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  invoiceIdContainer: { flex: 1 },
  invoiceId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  invoiceProducts: { fontSize: 12, color: "#6b7280" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  invoiceBody: { marginBottom: 12 },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  clientEmail: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  invoiceDates: { flexDirection: "row", gap: 16, marginBottom: 12 },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 2 },
  dateValue: { fontSize: 13, color: "#374151", fontWeight: "500" },
  amountContainer: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  amountLabel: { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  amountValue: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  invoiceActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  actionButtonPrimary: { backgroundColor: "#3b82f6" },
  actionButtonText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  actionButtonTextPrimary: { fontSize: 13, color: "#fff", fontWeight: "600" },

  // ─── MODALES BASE  ───
  modalFondo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    width: "100%",
    maxWidth: 420,
    maxHeight: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  modalTitulo: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  modalSubtitulo: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },

  // Sección separador
  seccionSeparador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  seccionTitulo: { fontSize: 14, fontWeight: "700", color: "#374151" },

  // Inputs
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
    minHeight: 48,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#111827" },
  inputSelectorText: {
    flex: 1,
    fontSize: 15,
    color: "#9ca3af",
    paddingVertical: 12,
  },
  inputSelectorTextSelected: { color: "#111827" },

  cantidadRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  btnAgregarCarrito: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
  },
  btnAgregarCarritoText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  carritoContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  carritoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  carritoTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  carritoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  carritoItemInfo: { flex: 1 },
  carritoItemNombre: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  carritoItemDetalle: { fontSize: 12, color: "#6b7280" },
  carritoItemAcciones: { flexDirection: "row", alignItems: "center", gap: 12 },
  carritoItemSubtotal: { fontSize: 14, fontWeight: "600", color: "#111827" },
  carritoItemEliminar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  carritoTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#3b82f6",
  },
  carritoTotalLabel: { fontSize: 15, fontWeight: "bold", color: "#111827" },
  carritoTotalValue: { fontSize: 18, fontWeight: "bold", color: "#1e3a8a" },

  radioGroup: { flexDirection: "row", gap: 8 },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  radioButtonActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
  radioButtonText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  radioButtonTextActive: { color: "#1e40af", fontWeight: "600" },

  modalBotones: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
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
  modalBtnCancelText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  modalBtnSaveText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  // ─── MODAL SELECTOR  ───
  modalSelectorContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalSelectorHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalSelectorTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  selectorSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectorSearchInput: { flex: 1, fontSize: 14, color: "#111827" },
  selectorList: { maxHeight: 400 },
  selectorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectorLastItem: {
    borderBottomWidth: 0,
  },
  selectorItemActive: { backgroundColor: "#eff6ff" },
  selectorItemContent: { flex: 1 },
  selectorItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  selectorItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  selectorItemSub: { fontSize: 12, color: "#6b7280" },
  selectorEmpty: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 24,
    fontStyle: "italic",
  },

  // ─── DETALLES FACTURA ───
  detailsContainer: { paddingTop: 8 },
  detailCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailCardTotal: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  detailCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailCardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  detailCardSubvalue: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  productoDetalleItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  productoDetalleNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  productoDetalleInfo: { fontSize: 13, color: "#6b7280" },
  detailTotalValue: { fontSize: 32, fontWeight: "bold", color: "#1e3a8a" },

  invoiceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },

  invoiceBtnPrimary: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },

  invoiceBtnSecondary: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  invoiceBtnPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  invoiceBtnSecondaryText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },

  modalExportContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },

  modalExportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },

  modalExportSection: {
    marginBottom: 16,
  },

  modalExportSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 6,
  },

  modalExportInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
});
