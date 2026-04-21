import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { getFacturaById } from "../services/invoicesService";

type DetalleFactura = {
  IdFactura: number;
  Fecha: string;
  Tipo: "Contado" | "Credito" | string;
  Estado: "Activo" | "Inactivo" | string;
  Total?: number;
  clienteNombre?: string;
  clienteCorreo?: string;
  clienteTelefono?: string;
  clienteCedula?: string;
  productos?: Array<{
    productoNombre?: string;
    Cantidad?: number;
    PrecioUnitario?: number;
    Subtotal?: number;
  }>;
};
const EMPRESA_CONFIG_KEY = "empresa_config";

type ConfigFactura = {
  empresaNombre?: string;
  empresaCedula?: string;
  empresaDireccion?: string;
  empresaTelefono?: string;
  empresaEmail?: string;
  clienteCedula?: string;
};

const STORAGE_KEY = "empresa_config";

/* =========================
   CONFIG PERSISTENTE
========================= */

export const guardarConfigEmpresa = async (config: {
  empresaNombre: string;
  empresaCedula: string;
  empresaDireccion: string;
  empresaTelefono: string;
  empresaEmail: string;
}) => {
  try {
    await AsyncStorage.setItem(
      EMPRESA_CONFIG_KEY,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error("❌ Error guardando config empresa:", error);
  }
};

export const obtenerConfigEmpresa = async () => {
  try {
    const data = await AsyncStorage.getItem(EMPRESA_CONFIG_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("❌ Error obteniendo config empresa:", error);
    return {};
  }
};

/* =========================
   HELPERS
========================= */

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CR");
};

export const calcularVencimiento = (fecha: string, tipo: string) => {
  const date = new Date(fecha);
  if ((tipo || "").toLowerCase() === "credito") {
    date.setDate(date.getDate() + 30);
  }
  return formatDate(date.toISOString().split("T")[0]);
};

export const mapEstadoUI = (estado: string) => {
  if (estado === "Activo") return "PAGADA";
  if (estado === "Inactivo") return "VENCIDA";
  return estado.toUpperCase();
};

/* =========================
   HTML
========================= */

const buildHTML = (
  detalle: DetalleFactura,
  empresa: ConfigFactura
) => {
  const numeroFactura = `INV-${String(detalle.IdFactura).padStart(3, "0")}`;
  const fechaEmision = formatDate(detalle.Fecha);
  const fechaVencimiento = calcularVencimiento(detalle.Fecha, detalle.Tipo);

  const totalFactura = detalle.Total ?? 0;

  const productosHTML =
    detalle.productos
      ?.map((p) => {
        const precio = p.PrecioUnitario ?? 0;
        const subtotal = p.Subtotal ?? 0;

        return `
        <tr>
          <td>${p.productoNombre}</td>
          <td style="text-align:center">${p.Cantidad}</td>
          <td style="text-align:right">₡${precio.toLocaleString("es-CR")}</td>
          <td style="text-align:right">₡${subtotal.toLocaleString("es-CR")}</td>
        </tr>
      `;
      })
      .join("") || "";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {
  font-family: Arial;
  padding: 40px;
  color: #333;
}

.header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 10px;
}

.company {
  max-width: 60%;
}

.company-name {
  font-size: 24px;
  font-weight: bold;
}

.invoice {
  text-align: right;
}

.section {
  margin-top: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f3f4f6;
}

.total {
  text-align: right;
  margin-top: 20px;
  font-size: 18px;
}
</style>
</head>

<body>

<div class="header">
  <div class="company">
    <div class="company-name">${empresa.empresaNombre || "Mi Empresa"}</div>
    <div>Cédula: ${empresa.empresaCedula || "-"}</div>
    <div>${empresa.empresaDireccion || ""}</div>
    <div>${empresa.empresaTelefono || ""}</div>
    <div>${empresa.empresaEmail || ""}</div>
  </div>

  <div class="invoice">
    <h2>${numeroFactura}</h2>
    <div>${mapEstadoUI(detalle.Estado)}</div>
  </div>
</div>

<div class="section">
  <strong>Cliente:</strong><br/>
  ${detalle.clienteNombre}<br/>
  ${detalle.clienteCorreo || ""}<br/>
  ${detalle.clienteTelefono || ""}<br/>
  Cédula: ${empresa.clienteCedula || "-"}
</div>

<div class="section">
  <strong>Fecha:</strong> ${fechaEmision}<br/>
  <strong>Vence:</strong> ${fechaVencimiento}<br/>
  <strong>Tipo:</strong> ${detalle.Tipo}
</div>

<table>
  <thead>
    <tr>
      <th>Producto</th>
      <th>Cantidad</th>
      <th>Precio</th>
      <th>Subtotal</th>
    </tr>
  </thead>
  <tbody>
    ${productosHTML}
  </tbody>
</table>

<div class="total">
  <strong>Total: ₡${totalFactura.toLocaleString("es-CR")}</strong>
</div>

</body>
</html>
`;
};

/* =========================
   EXPORTAR PDF
========================= */

export async function exportInvoicePDF(
  facturaId: number,
  config?: ConfigFactura
) {
  try {
    const detalle = await getFacturaById(facturaId);

    if (!detalle) {
      Alert.alert("Error", "Factura no encontrada");
      return;
    }

    // Obtener config guardada
    const configGuardada = await obtenerConfigEmpresa();

    const empresaFinal = {
      ...configGuardada,
      ...config,
    };

    if (config) {
      await guardarConfigEmpresa(empresaFinal);
    }

    const html = buildHTML(detalle, empresaFinal);

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }

    return uri;
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "No se pudo generar la factura");
  }
}