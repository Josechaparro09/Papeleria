import { format } from "date-fns";
import { PrintingRecord, Sale, Product, Service } from "../types/database";
import * as XLSX from "xlsx";
import { isSameDayColombia, formatDateColombia } from "./dateHelper";

/**
 * Exporta los registros de impresiones a un archivo Excel
 * @param records Los registros de impresión
 * @param filename Nombre del archivo (opcional)
 */
export const exportPrintingRecordsToExcel = (
  records: PrintingRecord[],
  filename: string = `Ganancias_Impresiones_${format(new Date(), "yyyy-MM-dd")}.xlsx`
): boolean => {
  try {
    // Crear la estructura de datos para Excel
    const data = records.map((record: PrintingRecord) => {
      // Calcular la ganancia
      const totalSheets = record.copies + record.prints + record.damaged_sheets;
      const totalCost = totalSheets * record.cost_per_sheet;

      const copyIncome = (record.price_per_copy || 0) * record.copies;
      const printIncome = (record.price_per_print || 0) * record.prints;
      const totalIncome = copyIncome + printIncome;

      const profit = totalIncome - totalCost;

      // Formato de fecha
      const formattedDate = format(new Date(record.date), "dd/MM/yyyy");

      // Retornar un objeto para cada fila
      return {
        "Fecha": formattedDate,
        "Copias": record.copies,
        "Impresiones": record.prints,
        "Hojas Dañadas": record.damaged_sheets,
        "Total Hojas": totalSheets,
        "Costo por Hoja": record.cost_per_sheet,
        "Precio por Copia": record.price_per_copy || 0,
        "Precio por Impresión": record.price_per_print || 0,
        "Costo Total": totalCost,
        "Ingresos": totalIncome,
        "Ganancia": profit,
        "Margen (%)": totalIncome > 0 ? Number((profit / totalIncome * 100).toFixed(2)) : 0,
      };
    });

    // Crear una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 12 }, // Fecha
      { wch: 8 }, // Copias
      { wch: 12 }, // Impresiones
      { wch: 14 }, // Hojas Dañadas
      { wch: 12 }, // Total Hojas
      { wch: 14 }, // Costo por Hoja
      { wch: 16 }, // Precio por Copia
      { wch: 18 }, // Precio por Impresión
      { wch: 12 }, // Costo Total
      { wch: 12 }, // Ingresos
      { wch: 12 }, // Ganancia
      { wch: 12 }, // Margen (%)
    ];
    worksheet["!cols"] = columnWidths;

    // Crear un libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ganancias de Impresiones");

    // Generar el archivo Excel y descargarlo
    XLSX.writeFile(workbook, filename);

    return true;
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    return false;
  }
};

/**
 * Prepara los datos de ganancias de productos para Excel
 */
const prepareProductsData = (sales: Sale[], products: Product[]): any[] => {
  // Filtrar solo ventas de productos
  const productSales = sales.filter((sale) => sale.type === "product" && sale.items && sale.items.length > 0);

  // Datos para Excel
  const data: any[] = [];

  // Procesar cada venta
  productSales.forEach((sale) => {
    const saleDate = format(new Date(sale.date), "dd/MM/yyyy");

    // Procesar cada item de la venta
    if (sale.items) {
      sale.items.forEach((item) => {
        if (!item.product_id) return;

        // Buscar el producto
        const product = products.find((p) => p.id === item.product_id);
        if (!product) return;

        // Calcular la ganancia
        const totalSale = item.price * item.quantity;
        const totalCost = product.purchase_price * item.quantity;
        const profit = totalSale - totalCost;
        const margin = totalSale > 0 ? (profit / totalSale) * 100 : 0;

        // Agregar fila a los datos
        data.push({
          "Fecha": saleDate,
          "Producto": product.name,
          "Cantidad": item.quantity,
          "Precio Unitario": item.price,
          "Costo Unitario": product.purchase_price,
          "Venta Total": totalSale,
          "Costo Total": totalCost,
          "Ganancia": profit,
          "Margen (%)": Number(margin.toFixed(2)),
        });
      });
    }
  });

  return data;
};

/**
 * Prepara los datos de ganancias de servicios para Excel
 */
const prepareServicesData = (sales: Sale[], services: Service[]): any[] => {
  // Filtrar solo ventas de servicios
  const serviceSales = sales.filter((sale) => sale.type === "service" && sale.items && sale.items.length > 0);

  // Datos para Excel
  const data: any[] = [];

  // Para servicios asumimos un margen de ganancia alto (80%)
  const defaultProfitMargin = 0.8;

  // Procesar cada venta
  serviceSales.forEach((sale) => {
    const saleDate = format(new Date(sale.date), "dd/MM/yyyy");

    // Procesar cada item de la venta
    if (sale.items) {
      sale.items.forEach((item) => {
        if (!item.service_id) return;

        // Buscar el servicio
        const service = services.find((s) => s.id === item.service_id);
        if (!service) return;

        // Calcular la ganancia asumiendo un costo bajo
        const totalSale = item.price * item.quantity;
        const estimatedCost = totalSale * (1 - defaultProfitMargin);
        const profit = totalSale - estimatedCost;

        // Agregar fila a los datos
        data.push({
          "Fecha": saleDate,
          "Servicio": service.name,
          "Cantidad": item.quantity,
          "Precio Unitario": item.price,
          "Venta Total": totalSale,
          "Costo Estimado": estimatedCost,
          "Ganancia": profit,
          "Margen (%)": Number((defaultProfitMargin * 100).toFixed(2)),
        });
      });
    }
  });

  return data;
};

/**
 * Prepara los datos de ganancias de impresiones para Excel
 */
const preparePrintingData = (records: PrintingRecord[]): any[] => {
  return records.map((record) => {
    // Calcular la ganancia
    const totalSheets = record.copies + record.prints + record.damaged_sheets;
    const totalCost = totalSheets * record.cost_per_sheet;

    const copyIncome = (record.price_per_copy || 0) * record.copies;
    const printIncome = (record.price_per_print || 0) * record.prints;
    const totalIncome = copyIncome + printIncome;

    const profit = totalIncome - totalCost;
    const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

    // Formato de fecha
    const formattedDate = format(new Date(record.date), "dd/MM/yyyy");

    // Retornar un objeto para cada fila
    return {
      "Fecha": formattedDate,
      "Descripción": record.copies > 0 && record.prints > 0
        ? "Copias e Impresiones"
        : record.copies > 0
        ? "Copias"
        : "Impresiones",
      "Copias": record.copies,
      "Impresiones": record.prints,
      "Hojas Totales": totalSheets,
      "Ingresos": totalIncome,
      "Costos": totalCost,
      "Ganancia": profit,
      "Margen (%)": Number(margin.toFixed(2)),
    };
  });
};

/**
 * Prepara los datos del resumen total para Excel
 */
const prepareSummaryData = (
  productsData: any[],
  servicesData: any[],
  printingData: any[]
): any[] => {
  // Calcular ganancias totales por tipo
  const productsProfit = productsData.reduce((sum, item) => sum + item["Ganancia"], 0);
  const servicesProfit = servicesData.reduce((sum, item) => sum + item["Ganancia"], 0);
  const printingProfit = printingData.reduce((sum, item) => sum + item["Ganancia"], 0);

  // Calcular totales globales
  const totalProfit = productsProfit + servicesProfit + printingProfit;

  // Calcular porcentajes
  const productsProfitPercent = totalProfit > 0 ? (productsProfit / totalProfit) * 100 : 0;
  const servicesProfitPercent = totalProfit > 0 ? (servicesProfit / totalProfit) * 100 : 0;
  const printingProfitPercent = totalProfit > 0 ? (printingProfit / totalProfit) * 100 : 0;

  // Crear los datos para el resumen
  return [
    { "Tipo": "Productos", "Ganancia": productsProfit, "Porcentaje": Number(productsProfitPercent.toFixed(2)) },
    { "Tipo": "Servicios", "Ganancia": servicesProfit, "Porcentaje": Number(servicesProfitPercent.toFixed(2)) },
    { "Tipo": "Impresiones", "Ganancia": printingProfit, "Porcentaje": Number(printingProfitPercent.toFixed(2)) },
    { "Tipo": "TOTAL", "Ganancia": totalProfit, "Porcentaje": 100 },
  ];
};

/**
 * Exporta todas las ganancias del negocio (productos, servicios e impresiones) a un archivo Excel.
 * Crea múltiples hojas y un resumen total.
 * @param sales Listado de ventas
 * @param products Listado de productos
 * @param services Listado de servicios
 * @param printingRecords Listado de registros de impresión
 * @param specificDate Fecha específica opcional para filtrar
 * @param filename Nombre del archivo (opcional)
 * @returns true si la exportación fue exitosa, false en caso contrario
 */
export const exportAllProfitsToExcel = (
  sales: Sale[],
  products: Product[],
  services: Service[],
  printingRecords: PrintingRecord[],
  specificDate?: string,
  filename: string = `Reporte_Ganancias_${format(new Date(), "yyyy-MM-dd")}.xlsx`
): boolean => {
  try {
    // Si se proporciona una fecha específica, filtrar los datos
    if (specificDate) {
      // Filtrar ventas y registros que coincidan con la fecha específica
      sales = sales.filter((sale) => isSameDayColombia(new Date(sale.date), new Date(specificDate)));
      printingRecords = printingRecords.filter((record) =>
        isSameDayColombia(new Date(record.date), new Date(specificDate))
      );

      // Actualizar el nombre del archivo para reflejar la fecha específica
      filename = `Reporte_Ganancias_${specificDate}.xlsx`;
    }

    // Crear un libro
    const workbook = XLSX.utils.book_new();

    // 1. Hoja de Ganancias de Productos
    const productsData = prepareProductsData(sales, products);
    const productSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productSheet, "Ganancias Productos");

    // 2. Hoja de Ganancias de Servicios
    const servicesData = prepareServicesData(sales, services);
    const serviceSheet = XLSX.utils.json_to_sheet(servicesData);
    XLSX.utils.book_append_sheet(workbook, serviceSheet, "Ganancias Servicios");

    // 3. Hoja de Ganancias de Impresiones
    const printingData = preparePrintingData(printingRecords);
    const printingSheet = XLSX.utils.json_to_sheet(printingData);
    XLSX.utils.book_append_sheet(workbook, printingSheet, "Ganancias Impresiones");

    // 4. Hoja de Resumen Total
    const summaryData = prepareSummaryData(productsData, servicesData, printingData);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen Total");

    // Generar el archivo Excel y descargarlo
    XLSX.writeFile(workbook, filename);

    return true;
  } catch (error) {
    console.error("Error al exportar ganancias a Excel:", error);
    return false;
  }
};

/**
 * Exporta un resumen mensual de ganancias a Excel
 * @param records Los registros de impresión
 * @param filename Nombre del archivo (opcional)
 */
export const exportPrintingProfitSummaryToExcel = (
  records: PrintingRecord[],
  filename: string = `Resumen_Mensual_Impresiones_${format(new Date(), "yyyy-MM")}.xlsx`
): boolean => {
  try {
    // Agrupar registros por mes
    const monthlyData: { [key: string]: any } = {};

    records.forEach((record) => {
      // Extraer año y mes
      const yearMonth = record.date.substring(0, 7); // formato: YYYY-MM
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          copies: 0,
          prints: 0,
          damaged: 0,
          totalSheets: 0,
          cost: 0,
          copyIncome: 0,
          printIncome: 0,
          totalIncome: 0,
          profit: 0,
        };
      }

      // Calcular los valores para este registro
      const totalSheets = record.copies + record.prints + record.damaged_sheets;
      const totalCost = totalSheets * record.cost_per_sheet;

      const copyIncome = (record.price_per_copy || 0) * record.copies;
      const printIncome = (record.price_per_print || 0) * record.prints;
      const totalIncome = copyIncome + printIncome;

      const profit = totalIncome - totalCost;

      // Acumular datos en el resumen mensual
      monthlyData[yearMonth].copies += record.copies;
      monthlyData[yearMonth].prints += record.prints;
      monthlyData[yearMonth].damaged += record.damaged_sheets;
      monthlyData[yearMonth].totalSheets += totalSheets;
      monthlyData[yearMonth].cost += totalCost;
      monthlyData[yearMonth].copyIncome += copyIncome;
      monthlyData[yearMonth].printIncome += printIncome;
      monthlyData[yearMonth].totalIncome += totalIncome;
      monthlyData[yearMonth].profit += profit;
    });

    // Convertir los datos agrupados en un array para Excel
    const summaryData = Object.entries(monthlyData).map(([yearMonth, data]) => {
      // Formatear el mes para visualización
      const [year, month] = yearMonth.split("-");
      const formattedMonth = format(
        new Date(parseInt(year), parseInt(month) - 1, 1),
        "MMMM yyyy"
      );

      return {
        "Mes": formattedMonth,
        "Total Copias": data.copies,
        "Total Impresiones": data.prints,
        "Hojas Dañadas": data.damaged,
        "Total Hojas": data.totalSheets,
        "Costo Total": data.cost,
        "Ingresos por Copias": data.copyIncome,
        "Ingresos por Impresiones": data.printIncome,
        "Ingresos Totales": data.totalIncome,
        "Ganancia": data.profit,
        "Margen (%)": data.totalIncome > 0 ? Number((data.profit / data.totalIncome * 100).toFixed(2)) : 0,
      };
    }).sort((a: any, b: any) => {
      // Ordenar por fecha descendente
      const monthA = a["Mes"].split(" ");
      const monthB = b["Mes"].split(" ");

      const dateA = new Date(parseInt(monthA[1]), new Date(Date.parse(monthA[0] + " 1, 2000")).getMonth(), 1);
      const dateB = new Date(parseInt(monthB[1]), new Date(Date.parse(monthB[0] + " 1, 2000")).getMonth(), 1);

      return dateB.getTime() - dateA.getTime();
    });

    // Crear una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(summaryData);

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 14 }, // Mes
      { wch: 12 }, // Total Copias
      { wch: 16 }, // Total Impresiones
      { wch: 14 }, // Hojas Dañadas
      { wch: 12 }, // Total Hojas
      { wch: 12 }, // Costo Total
      { wch: 18 }, // Ingresos por Copias
      { wch: 22 }, // Ingresos por Impresiones
      { wch: 14 }, // Ingresos Totales
      { wch: 12 }, // Ganancia
      { wch: 12 }, // Margen (%)
    ];
    worksheet["!cols"] = columnWidths;

    // Crear un libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen Mensual");

    // Generar el archivo Excel y descargarlo
    XLSX.writeFile(workbook, filename);

    return true;
  } catch (error) {
    console.error("Error al exportar resumen a Excel:", error);
    return false;
  }
};