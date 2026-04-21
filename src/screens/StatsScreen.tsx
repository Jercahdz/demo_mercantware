import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

const FAKE_CHART_DATA = [
  {
    value: 420000,
    label: "Ene",
    frontColor: "#3b82f6",
    spacing: 2,
    labelWidth: 35,
    labelTextStyle: { color: "#6b7280", fontSize: 10 },
  },
  {
    value: 680000,
    label: "Feb",
    frontColor: "#3b82f6",
    spacing: 2,
    labelWidth: 35,
    labelTextStyle: { color: "#6b7280", fontSize: 10 },
  },
  {
    value: 510000,
    label: "Mar",
    frontColor: "#3b82f6",
    spacing: 2,
    labelWidth: 35,
    labelTextStyle: { color: "#6b7280", fontSize: 10 },
  },
  {
    value: 890000,
    label: "Abr",
    frontColor: "#3b82f6",
    spacing: 2,
    labelWidth: 35,
    labelTextStyle: { color: "#6b7280", fontSize: 10 },
  },
  {
    value: 740000,
    label: "May",
    frontColor: "#3b82f6",
    spacing: 2,
    labelWidth: 35,
    labelTextStyle: { color: "#6b7280", fontSize: 10 },
  },
  {
    value: 620000,
    label: "Jun",
    frontColor: "#3b82f6",
    spacing: 2,
    labelWidth: 35,
    labelTextStyle: { color: "#6b7280", fontSize: 10 },
  },
];

const FAKE_PIE_DATA = [
  { value: 60, color: "#10b981", focused: true, text: "60%" },
  { value: 40, color: "#f59e0b", text: "40%" },
];

const FAKE_PRODUCTOS = [
  {
    Nombre: "Producto A",
    Categoria: "Categoría 1",
    ingresoTotal: 980000,
    totalVendido: 45,
  },
  {
    Nombre: "Producto B",
    Categoria: "Categoría 2",
    ingresoTotal: 760000,
    totalVendido: 32,
  },
  {
    Nombre: "Producto C",
    Categoria: "Categoría 1",
    ingresoTotal: 540000,
    totalVendido: 28,
  },
];

const FAKE_CLIENTES = [
  {
    nombre: "Cliente Ejemplo 1",
    telefono: "8888-8888",
    totalCompras: 1200000,
    totalFacturas: 8,
  },
  {
    nombre: "Cliente Ejemplo 2",
    telefono: "7777-7777",
    totalCompras: 870000,
    totalFacturas: 5,
  },
  {
    nombre: "Cliente Ejemplo 3",
    telefono: "6666-6666",
    totalCompras: 540000,
    totalFacturas: 3,
  },
];

export default function StatsScreen() {
  const formatearMonedaCompleta = (monto: number) =>
    `₡${monto.toLocaleString("es-CR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenHeader}>
          <View>
            <Text style={styles.screenTitle}>Estadísticas</Text>
            <Text style={styles.screenSubtitle}>
              Análisis de tus ingresos y ventas
            </Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: "#eff6ff" }]}>
            <Feather name="dollar-sign" size={32} color="#3b82f6" />
            <Text style={styles.summaryLabel}>Ingresos Totales</Text>
            <Text style={[styles.summaryValue, { color: "#1e40af" }]}>
              {formatearMonedaCompleta(3890000)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#f0fdf4" }]}>
            <Feather name="file-text" size={32} color="#10b981" />
            <Text style={styles.summaryLabel}>Total Facturas</Text>
            <Text style={[styles.summaryValue, { color: "#15803d" }]}>24</Text>
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerWithIcon}>
                <Feather name="pie-chart" size={20} color="#3b82f6" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Ventas por Tipo</Text>
                  <Text style={styles.subtitle}>Distribución de pagos</Text>
                </View>
              </View>
            </View>
            <View style={styles.pieContainer}>
              <PieChart
                data={FAKE_PIE_DATA}
                donut
                sectionAutoFocus
                radius={90}
                innerRadius={60}
                innerCircleColor={"#fff"}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelValue}>₡3.9M</Text>
                    <Text style={styles.centerLabelText}>Total</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.pieLegendContainer}>
              <View style={styles.pieLegendItem}>
                <View
                  style={[styles.pieLegendDot, { backgroundColor: "#10b981" }]}
                />
                <View style={styles.pieLegendInfo}>
                  <Text style={styles.pieLegendLabel}>Contado</Text>
                  <Text style={styles.pieLegendValue}>
                    {formatearMonedaCompleta(2334000)}
                  </Text>
                </View>
              </View>
              <View style={styles.pieLegendItem}>
                <View
                  style={[styles.pieLegendDot, { backgroundColor: "#f59e0b" }]}
                />
                <View style={styles.pieLegendInfo}>
                  <Text style={styles.pieLegendLabel}>Crédito</Text>
                  <Text style={styles.pieLegendValue}>
                    {formatearMonedaCompleta(1556000)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerWithIcon}>
                <Feather name="clipboard" size={20} color="#3b82f6" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Estado de Facturas</Text>
                  <Text style={styles.subtitle}>Pagadas vs Vencidas</Text>
                </View>
              </View>
            </View>
            <View style={styles.statusBarContainer}>
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: "75%", backgroundColor: "#10b981" },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.statusStatsContainer}>
                <View style={styles.statusStatItem}>
                  <View style={styles.statusStatHeader}>
                    <Feather name="check-circle" size={16} color="#10b981" />
                    <Text style={styles.statusStatLabel}>Pagadas</Text>
                  </View>
                  <Text style={[styles.statusStatValue, { color: "#10b981" }]}>
                    18
                  </Text>
                  <Text style={styles.statusStatPercentage}>75%</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusStatItem}>
                  <View style={styles.statusStatHeader}>
                    <Feather name="x-circle" size={16} color="#ef4444" />
                    <Text style={styles.statusStatLabel}>Vencidas</Text>
                  </View>
                  <Text style={[styles.statusStatValue, { color: "#ef4444" }]}>
                    6
                  </Text>
                  <Text style={styles.statusStatPercentage}>25%</Text>
                </View>
              </View>
              <View style={styles.totalFacturasContainer}>
                <Text style={styles.totalFacturasLabel}>Total de facturas</Text>
                <Text style={styles.totalFacturasValue}>24</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerWithIcon}>
                <Feather name="bar-chart-2" size={20} color="#3b82f6" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Ingresos Mensuales</Text>
                  <Text style={styles.subtitle}>Últimos 12 meses</Text>
                </View>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  {formatearMonedaCompleta(3890000)}
                </Text>
              </View>
            </View>
            <View style={styles.chartContainer}>
              <BarChart
                data={FAKE_CHART_DATA}
                width={width - 80}
                height={220}
                barWidth={28}
                spacing={24}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: "#9ca3af", fontSize: 11 }}
                noOfSections={4}
                maxValue={1200000}
                isAnimated
                animationDuration={800}
                frontColor="#3b82f6"
              />
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#3b82f6" }]}
                />
                <Text style={styles.legendText}>Ingresos activos</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerWithIcon}>
                <Feather name="package" size={20} color="#3b82f6" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Top Productos</Text>
                  <Text style={styles.subtitle}>Más vendidos</Text>
                </View>
              </View>
            </View>
            <View style={styles.topListContainer}>
              {FAKE_PRODUCTOS.map((producto, index) => (
                <View key={index} style={styles.topListItem}>
                  <View style={styles.topListRank}>
                    <Text style={styles.topListRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topListInfo}>
                    <Text style={styles.topListName}>{producto.Nombre}</Text>
                    <Text style={styles.topListCategory}>
                      {producto.Categoria}
                    </Text>
                  </View>
                  <View style={styles.topListStats}>
                    <Text style={styles.topListAmount}>
                      {formatearMonedaCompleta(producto.ingresoTotal)}
                    </Text>
                    <Text style={styles.topListQuantity}>
                      {producto.totalVendido} unidades
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerWithIcon}>
                <Feather name="users" size={20} color="#3b82f6" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Top Clientes</Text>
                  <Text style={styles.subtitle}>Mejores compradores</Text>
                </View>
              </View>
            </View>
            <View style={styles.topListContainer}>
              {FAKE_CLIENTES.map((cliente, index) => (
                <View key={index} style={styles.topListItem}>
                  <View
                    style={[styles.topListRank, { backgroundColor: "#fef3c7" }]}
                  >
                    <Text
                      style={[styles.topListRankText, { color: "#92400e" }]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.topListInfo}>
                    <Text style={styles.topListName}>{cliente.nombre}</Text>
                    <View style={styles.clientePhoneRow}>
                      <Feather name="phone" size={12} color="#6b7280" />
                      <Text style={styles.topListCategory}>
                        {cliente.telefono}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.topListStats}>
                    <Text style={styles.topListAmount}>
                      {formatearMonedaCompleta(cliente.totalCompras)}
                    </Text>
                    <Text style={styles.topListQuantity}>
                      {cliente.totalFacturas}{" "}
                      {cliente.totalFacturas === 1 ? "factura" : "facturas"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <BlurView intensity={100} tint="light" style={styles.overlay}>
        <View style={styles.overlayContent}>
          <Feather name="lock" size={50} color="#3b82f6" />
          <Text style={styles.overlayTitle}>Función Premium</Text>
          <Text style={styles.overlayText}>
            Para desbloquear esta sección adquiere la versión completa
          </Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#f9fafb" },
  scrollView: { flex: 1 },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    marginTop: 8,
  },
  screenSubtitle: { fontSize: 14, color: "#6b7280" },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  summaryCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
    marginTop: 8,
  },
  summaryValue: { fontSize: 18, fontWeight: "bold" },
  container: { paddingHorizontal: 20, marginTop: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerWithIcon: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  headerTextContainer: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: "#6b7280" },
  totalBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    color: "#3b82f6",
    fontWeight: "600",
    marginBottom: 2,
  },
  totalAmount: { fontSize: 16, fontWeight: "bold", color: "#1e40af" },
  chartContainer: { marginVertical: 10, alignItems: "center" },
  topLabel: {
    fontSize: 9,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 2,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: "#6b7280" },
  pieContainer: { alignItems: "center", marginVertical: 20 },
  centerLabel: { alignItems: "center" },
  centerLabelValue: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  centerLabelText: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  pieLegendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  pieLegendItem: { flexDirection: "row", alignItems: "center" },
  pieLegendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  pieLegendInfo: { alignItems: "flex-start" },
  pieLegendLabel: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  pieLegendValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  topListContainer: { gap: 12 },
  topListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
  },
  topListRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  topListRankText: { fontSize: 14, fontWeight: "bold", color: "#1e40af" },
  topListInfo: { flex: 1 },
  topListName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  topListCategory: { fontSize: 12, color: "#6b7280", marginLeft: 4 },
  clientePhoneRow: { flexDirection: "row", alignItems: "center" },
  topListStats: { alignItems: "flex-end" },
  topListAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 2,
  },
  topListQuantity: { fontSize: 11, color: "#6b7280" },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
  },
  statusBarContainer: { marginTop: 10 },
  progressBarWrapper: { marginBottom: 24 },
  progressBarBackground: {
    height: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 6 },
  statusStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statusStatItem: { flex: 1, alignItems: "center" },
  statusStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusStatLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  statusStatValue: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  statusStatPercentage: { fontSize: 12, color: "#9ca3af" },
  statusDivider: { width: 1, backgroundColor: "#e5e7eb", marginHorizontal: 16 },
  totalFacturasContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
  },
  totalFacturasLabel: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  totalFacturasValue: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.45)",
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
});
