// src/screens/ProductScreen.tsx
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
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
import {
  TextInput as PaperInput,
  Provider as PaperProvider,
} from "react-native-paper";
import CustomToast from "../components/Toast";
import {
  deleteProduct,
  getCategorias,
  getProducts,
  insertProduct,
  updateProduct,
} from "../services/productService";

type Product = {
  IdProducto: number;
  Nombre: string;
  Categoria: string;
  Precio: number;
  Cantidad: number;
};

const STOCK_FILTERS = [
  { label: "Recientes", value: null },
  { label: "Menos -", value: "stock_asc" },
  { label: "Más +", value: "stock_desc" },
] as const;

// ── Helpers de sanitización/validación ─────────────────────────────────────────
const NOMBRE_PRODUCTO_REGEX = /^[0-9a-zA-ZáéíóúÁÉÍÓÚñÑ\s'.\-()_/]+$/;
const CATEGORIA_REGEX = /^[0-9a-zA-ZáéíóúÁÉÍÓÚñÑ\s'.\-()_/]+$/;

const normalizarTexto = (s: string) =>
  s.normalize("NFC").replace(/\s+/g, " ").trim();

const soloDigitos = (s: string) => s.replace(/\D+/g, "");

const sanitizarPrecioInput = (s: string) => {
  const limpio = s.replace(/[^0-9.]/g, "");
  const parts = limpio.split(".");
  if (parts.length === 1) return parts[0];
  const entero = parts[0];
  const dec = parts.slice(1).join("");
  return `${entero}.${dec.slice(0, 2)}`;
};

const parsePrecio = (s: string) => {
  if (!s) return NaN;
  return parseFloat(s.replace(",", "."));
};

export default function ProductScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [categories, setCategories] = useState<string[]>(["Todas"]);
  const [stockOrder, setStockOrder] = useState<
    "stock_asc" | "stock_desc" | null
  >(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<null | Product>(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Campos del formulario (para MODAL estilo HomeScreen)
  const [nameText, setNameText] = useState("");
  const [categoryText, setCategoryText] = useState("");
  const [priceText, setPriceText] = useState("");
  const [stockText, setStockText] = useState("");
  const [formKey, setFormKey] = useState(0);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<string | null>(
    null,
  );

  const [isSelecting, setIsSelecting] = useState(false);

  // ── Toast ────────────────────────────────────────────
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    loadProducts();
    loadCategorias();
  }, [stockOrder]);

  // Recargar al volver al foco
  useEffect(() => {
    const unsubscribe = (navigation as any)?.addListener?.("focus", () => {
      loadProducts();
    });
    return unsubscribe;
  }, [navigation]);

  // Avisos de stock - MEJORADO CON DETALLE
  const verificarStockBajo = (productos: Product[]) => {
    const productosSinStock = productos.filter((p) => p.Cantidad === 0);
    const productosConStockBajo = productos.filter(
      (p) => p.Cantidad <= 10 && p.Cantidad > 0,
    );

    // Prioridad 1: Productos sin stock
    if (productosSinStock.length > 0) {
      if (productosSinStock.length === 1) {
        showToast(
          `AGOTADO: "${productosSinStock[0].Nombre}" - 0 unidades disponibles`,
          "error",
        );
      } else {
        const lista = productosSinStock.map((p) => `• ${p.Nombre}`).join("\n");
        showToast(
          `${productosSinStock.length} productos AGOTADOS:\n${lista}`,
          "error",
        );
      }
    }
    // Prioridad 2: Productos con stock bajo
    else if (productosConStockBajo.length > 0) {
      if (productosConStockBajo.length === 1) {
        const p = productosConStockBajo[0];
        showToast(
          `POCAS UNIDADES: "${p.Nombre}" - Solo quedan ${p.Cantidad} unidad${
            p.Cantidad === 1 ? "" : "es"
          }`,
          "warning",
        );
      } else {
        const lista = productosConStockBajo
          .map((p) => `• ${p.Nombre} (${p.Cantidad} unidades)`)
          .join("\n");
        showToast(
          `${productosConStockBajo.length} productos con POCAS UNIDADES:\n${lista}`,
          "warning",
        );
      }
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts(stockOrder || undefined);
      setProducts(data);
      if (data.length > 0) verificarStockBajo(data);
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      showToast("Error al cargar los productos", "error");
    }
  };

  const loadCategorias = async () => {
    const data = await getCategorias();
    setCategories(data);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchQuery =
        !q ||
        p.Nombre.toLowerCase().includes(q) ||
        p.Categoria.toLowerCase().includes(q);
      const matchCategory = category === "Todas" || p.Categoria === category;
      return matchQuery && matchCategory;
    });
  }, [products, query, category]);

  const openAdd = () => {
    setEditing(null);
    setNameText("");
    setCategoryText("");
    setPriceText("");
    setStockText("");
    setFormKey((k) => k + 1);
    setModalVisible(true);
  };

  const openEdit = (item: Product) => {
    setEditing(item);
    setNameText(item.Nombre);
    setCategoryText(item.Categoria);
    setPriceText(String(item.Precio.toFixed(2)));
    setStockText(String(item.Cantidad));
    setFormKey((k) => k + 1);
    setModalVisible(true);
  };

  const validate = (price: number, stock: number): boolean => {
    const nombre = normalizarTexto(nameText);
    if (!nombre) {
      showToast("El nombre es obligatorio", "error");
      return false;
    }
    if (nombre.length < 3) {
      showToast("El nombre debe tener al menos 3 caracteres", "error");
      return false;
    }

    const cat = normalizarTexto(categoryText);
    if (!cat) {
      showToast("La categoría es obligatoria", "error");
      return false;
    }
    if (!CATEGORIA_REGEX.test(cat)) {
      showToast("La categoría contiene caracteres inválidos", "error");
      return false;
    }
    if (cat.toLowerCase() === "todas") {
      showToast("Selecciona una categoría específica (no 'Todas')", "error");
      return false;
    }

    if (Number.isNaN(price) || price < 5) {
      showToast("Precio inválido (debe ser 5 o mayor)", "error");
      return false;
    }

    if (!stockText.trim()) {
      showToast("La cantidad es obligatoria", "error");
      return false;
    }
    if (!Number.isInteger(stock)) {
      showToast("La cantidad debe ser un número entero", "error");
      return false;
    }
    if (stock < 0) {
      showToast("La cantidad no puede ser negativa", "error");
      return false;
    }

    return true;
  };

  const save = async () => {
    const nombre = normalizarTexto(nameText);
    const categoria = normalizarTexto(categoryText);
    const price = parsePrecio(priceText);
    const stock = parseInt(soloDigitos(stockText || "0"), 10);

    if (!validate(price, stock)) return;

    try {
      if (editing) {
        await updateProduct(
          editing.IdProducto,
          nombre,
          categoria,
          Number(price.toFixed(2)),
          stock,
        );
        showToast("Producto actualizado correctamente", "success");
      } else {
        await insertProduct(nombre, categoria, Number(price.toFixed(2)), stock);
        showToast("Producto agregado correctamente", "success");
      }
      setModalVisible(false);
      setEditing(null);
      setQuery("");
      await loadProducts();
      await loadCategorias();
    } catch (error) {
      console.error("❌ Error guardando producto:", error);
      showToast("Error al guardar el producto", "error");
    }
  };

  const del = (item: Product) => {
    setProductToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.IdProducto);
      await loadProducts();
      showToast("Producto eliminado correctamente", "success");
    } catch (error) {
      console.error("❌ Error eliminando producto:", error);
      showToast("No se pudo eliminar el producto", "error");
    } finally {
      setDeleteModalVisible(false);
      setProductToDelete(null);
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const stockColor =
      item.Cantidad < 10
        ? "#dc2626"
        : item.Cantidad < 20
          ? "#f59e0b"
          : "#16a34a";
    const stockBg =
      item.Cantidad < 10
        ? "#fee2e2"
        : item.Cantidad < 20
          ? "#fef3c7"
          : "#dcfce7";
    const stockBorder =
      item.Cantidad < 10
        ? "#fca5a5"
        : item.Cantidad < 20
          ? "#fcd34d"
          : "#86efac";

    return (
      <View style={styles.invoiceCard}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceIdContainer}>
            <Text style={styles.invoiceId}>{item.Nombre}</Text>
            <Text style={styles.invoiceProducts}>{item.Categoria}</Text>
          </View>
          <View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: stockBg, borderColor: stockBorder },
              ]}
            >
              <Text style={[styles.statusText, { color: stockColor }]}>
                {item.Cantidad} {item.Cantidad === 1 ? "unidad" : "unidades"}
              </Text>
            </View>

            {item.Cantidad === 0 && (
              <View
                style={[
                  styles.alertBadge,
                  { backgroundColor: "#7f1d1d", marginTop: 6 },
                ]}
              >
                <Text style={styles.alertBadgeText}>AGOTADO</Text>
              </View>
            )}
            {item.Cantidad > 0 && item.Cantidad <= 10 && (
              <View
                style={[
                  styles.alertBadge,
                  { backgroundColor: "#92400e", marginTop: 6 },
                ]}
              >
                <Text style={styles.alertBadgeText}>STOCK BAJO</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.invoiceBody}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Precio</Text>
            <Text style={styles.amountValue}>₡ {item.Precio.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEdit(item)}
          >
            <Feather name="edit-2" size={16} color="#374151" />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => del(item)}
          >
            <Feather name="trash-2" size={16} color="#991b1b" />
            <Text style={styles.actionButtonTextDanger}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const paperProps = {
    mode: "flat" as const,
    dense: true,
    style: { backgroundColor: "transparent", flex: 1, paddingVertical: 0 },
    contentStyle: { color: "#111827" },
    placeholderTextColor: "#9ca3af",
    selectionColor: "#a3a3a3",
    underlineColor: "transparent",
    activeUnderlineColor: "transparent",
  };

  return (
    <PaperProvider>
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Productos</Text>
              <Text style={styles.headerSubtitle}>
                Gestiona y monitorea tu inventario
              </Text>
            </View>

            <TouchableOpacity style={styles.newInvoiceButton} onPress={openAdd}>
              <View style={styles.newButtonContent}>
                <Feather name="package" size={18} color="#fff" />
                <Text style={styles.plusSign}>+</Text>
                <Text style={styles.newInvoiceButtonText}>
                  Agregar Producto
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <Feather
                name="search"
                size={18}
                color="#6b7280"
                style={{ marginRight: 8 }}
              />
              <PaperInput
                {...paperProps}
                placeholder="Buscar productos…"
                value={query}
                onChangeText={setQuery}
              />
            </View>

            <View style={styles.stockFilterWrapper}>
              <Text style={styles.stockFilterLabel}>Ordenar:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stockFilterScroll}
                decelerationRate="fast"
                snapToAlignment="start"
                snapToInterval={60}
              >
                {STOCK_FILTERS.map((filter) => {
                  const active = stockOrder === filter.value;
                  return (
                    <TouchableOpacity
                      key={filter.label}
                      style={[
                        styles.stockFilterButton,
                        active && styles.stockFilterButtonActive,
                      ]}
                      onPress={() => setStockOrder(filter.value as any)}
                    >
                      <Text
                        style={[
                          styles.stockFilterText,
                          active && styles.stockFilterTextActive,
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingRight: 20,
              }}
              style={styles.filtersContainer}
            >
              {categories.map((c) => {
                const active = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    style={[
                      styles.filterButton,
                      active && styles.filterButtonActive,
                    ]}
                    onPress={() => setCategory(c)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        active && styles.filterButtonTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>
                Mostrando {filtered.length} de {products.length} productos
              </Text>
              <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.IdProducto)}
                renderItem={renderItem}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
              />
            </View>

            {filtered.length === 0 && (
              <View style={styles.emptyContainer}>
                <Feather name="package" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No hay productos</Text>
                <Text style={styles.emptySubtitle}>
                  {query || category !== "Todas"
                    ? "No se encontraron productos con los filtros aplicados"
                    : "Agrega tu primer producto"}
                </Text>
              </View>
            )}
          </ScrollView>

          <Modal
            visible={modalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
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
                    name={editing ? "edit-3" : "package"}
                    size={24}
                    color="#3b82f6"
                  />
                  <Text style={styles.modalTitulo}>
                    {editing ? "Editar Producto" : "Nuevo Producto"}
                  </Text>
                </View>
                <Text style={styles.modalSubtitulo}>
                  {editing
                    ? "Actualiza la información del producto"
                    : "Ingresa los datos del nuevo producto"}
                </Text>

                {/* Nombre */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nombre *</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="tag" size={16} color="#9ca3af" />
                    <TextInput
                      key={`${formKey}-name`}
                      style={styles.input}
                      placeholder="Ingrese el nombre del producto"
                      value={nameText}
                      onChangeText={(t) => setNameText(t)}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Categoría */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Categoría *</Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, { paddingVertical: 12 }]}
                    onPress={() => setShowCategoryModal(true)}
                  >
                    <Feather name="layers" size={16} color="#9ca3af" />
                    <Text
                      style={{
                        flex: 1,
                        color: categoryText ? "#111827" : "#9ca3af",
                      }}
                    >
                      {categoryText || "Seleccionar o crear categoría"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Precio */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Precio *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={{ fontSize: 16, color: "#9ca3af" }}>₡</Text>
                    <TextInput
                      key={`${formKey}-price`}
                      style={styles.input}
                      placeholder="0.00"
                      value={priceText}
                      onChangeText={(t) =>
                        setPriceText(sanitizarPrecioInput(t))
                      }
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Stock */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Cantidad *</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="package" size={16} color="#9ca3af" />
                    <TextInput
                      key={`${formKey}-stock`}
                      style={styles.input}
                      placeholder="0"
                      value={stockText}
                      onChangeText={(t) => setStockText(soloDigitos(t))}
                      keyboardType="number-pad"
                      placeholderTextColor="#9ca3af"
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
                    onPress={save}
                  >
                    <Text style={styles.modalBtnSaveText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={showCategoryModal} transparent animationType="fade">
            <View style={styles.modalFondo}>
              <View style={styles.modalContainer}>
                <CustomToast
                  visible={toastVisible}
                  message={toastMessage}
                  type={toastType}
                  onHide={() => setToastVisible(false)}
                />
                {/* HEADER */}
                <View style={styles.modalHeader}>
                  <Feather name="layers" size={24} color="#3b82f6" />
                  <Text style={styles.modalTitulo}>Categorías</Text>
                </View>

                <Text style={styles.modalSubtitulo}>
                  Selecciona una categoría o crea una nueva
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nueva categoría</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="edit-3" size={16} color="#9ca3af" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ingrese una categoría"
                      value={categoryText}
                      onChangeText={(t) => {
                        setCategoryText(t);
                        setIsSelecting(false);
                      }}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
                <Text style={styles.sectionTitle}>Categorías</Text>
                {/* LISTA DE CATEGORÍAS */}
                <ScrollView
                  style={{ maxHeight: 180, marginTop: 10 }}
                  showsVerticalScrollIndicator={false}
                >
                  {categories
                    .filter((c) => c !== "Todas")
                    .map((cat) => (
                      <View key={cat} style={styles.categoryItemRow}>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => {
                            setCategoryText(cat);
                            setIsSelecting(true);
                            setShowCategoryModal(false);
                          }}
                        >
                          <Text style={styles.categoryText}>{cat}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteCategoryBtn}
                          onPress={() => {
                            setCategoriaAEliminar(cat);
                            setModalDeleteVisible(true);
                          }}
                        >
                          <Feather name="trash-2" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </ScrollView>

                <View style={styles.modalBotones}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowCategoryModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSave]}
                    onPress={() => {
                      const textoNormalizado = normalizarTexto(categoryText);
                      const nueva = textoNormalizado.toLowerCase();

                      const existe = categories.some(
                        (c) => c.toLowerCase() === nueva,
                      );

                      if (!isSelecting && existe) {
                        showToast("Esa categoría ya existe", "warning");
                        return;
                      }

                      if (!textoNormalizado) {
                        showToast("Ingresa una categoría", "warning");
                        return;
                      }

                      setCategoryText(textoNormalizado);
                      setShowCategoryModal(false);
                      setIsSelecting(false);
                    }}
                  >
                    <Text style={styles.modalBtnSaveText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={modalDeleteVisible} transparent animationType="fade">
            <View style={styles.modalFondo}>
              <View style={styles.modalContainer}>
                {/* HEADER */}
                <View style={styles.modalHeader}>
                  <Feather name="alert-triangle" size={24} color="#ef4444" />
                  <Text style={styles.modalTitulo}>Eliminar categoría</Text>
                </View>

                <Text style={styles.modalSubtitulo}>
                  ¿Seguro que deseas eliminar esta categoría?
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {categoriaAEliminar}
                  </Text>
                </View>

                {/* BOTONES */}
                <View style={styles.modalBotones}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => {
                      setModalDeleteVisible(false);
                      setCategoriaAEliminar(null);
                    }}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: "#ef4444" }, // rojo
                    ]}
                    onPress={() => {
                      if (!categoriaAEliminar) return;

                      const nuevasCategorias = categories.filter(
                        (c) => c !== categoriaAEliminar,
                      );

                      setCategories(nuevasCategorias);

                      showToast("Categoría eliminada", "success");

                      setModalDeleteVisible(false);
                      setCategoriaAEliminar(null);
                    }}
                  >
                    <Text style={styles.modalBtnSaveText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={deleteModalVisible} transparent animationType="fade">
            <View style={styles.modalFondo}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Feather name="alert-triangle" size={24} color="#dc2626" />
                  <Text style={styles.modalTitulo}>Eliminar Producto</Text>
                </View>

                <Text style={styles.modalSubtitulo}>
                  ¿Seguro que deseas eliminar{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {productToDelete?.Nombre}
                  </Text>
                  ?
                </Text>

                <View style={styles.modalBotones}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setDeleteModalVisible(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnDelete]}
                    onPress={confirmDelete}
                  >
                    <Text style={styles.modalBtnDeleteText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </PaperProvider>
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

  newInvoiceButton: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plusSign: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  newInvoiceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

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
  },

  stockFilterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  stockFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginRight: 8,
  },
  stockFilterScroll: {
    flexDirection: "row",
    gap: 8,
  },
  stockFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  stockFilterButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  stockFilterText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  stockFilterTextActive: {
    color: "#fff",
  },

  filtersContainer: { marginBottom: 16 },
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
  listContent: { gap: 12 },

  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
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
  invoiceId: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  invoiceProducts: { fontSize: 12, color: "#6b7280" },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: "600" },

  // Badges de alerta
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  alertBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },

  invoiceBody: { marginBottom: 12 },
  amountContainer: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  amountLabel: { fontSize: 11, color: "#6b7280" },
  amountValue: { fontSize: 20, fontWeight: "bold", color: "#111827" },

  invoiceActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  actionButtonDanger: { backgroundColor: "#fee2e2" },
  actionButtonText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  actionButtonTextDanger: { fontSize: 13, color: "#991b1b", fontWeight: "500" },

  // ===== Estilos de MODAL replicando HomeScreen =====
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
  categoryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },

  categoryText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  modalBtnDelete: {
    backgroundColor: "#dc2626",
  },

  modalBtnDeleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  categoryItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  deleteCategoryBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 6,
  },
});
