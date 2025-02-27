// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Package,
  Receipt,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Clock,
  Printer,
  Download,
  Calendar,
  Wrench,
  FileText,
  AlertCircle
} from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { useSales } from "../hooks/useSales";
import { useProducts } from "../hooks/useProducts";
import { useServices } from "../hooks/useServices";
import { usePrintingRecords } from "../hooks/usePrintingRecords";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import formatMoney from "../utils/format";
import { es } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { exportAllProfitsToExcel } from "../utils/excelExport";
import DateFilter from "../components/DateFilter";

function Dashboard() {
  const { stats, loading } = useDashboard();
  const { sales } = useSales();
  const { products } = useProducts();
  const { services } = useServices();
  const { records } = usePrintingRecords();

  // Estado para el filtro de fecha
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  
  const [popularProducts, setPopularProducts] = useState<{ name: string; count: number }[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  
  // Estados para las ganancias
  const [todayPrintingProfit, setTodayPrintingProfit] = useState(0);
  const [monthlyPrintingProfit, setMonthlyPrintingProfit] = useState(0);
  const [todayProductsProfit, setTodayProductsProfit] = useState(0);
  const [monthlyProductsProfit, setMonthlyProductsProfit] = useState(0);
  const [todayServicesProfit, setTodayServicesProfit] = useState(0);
  const [monthlyServicesProfit, setMonthlyServicesProfit] = useState(0);
  
  // Estado para las ganancias filtradas por fecha
  const [dateProductsProfit, setDateProductsProfit] = useState(0);
  const [dateServicesProfit, setDateServicesProfit] = useState(0);
  const [datePrintingProfit, setDatePrintingProfit] = useState(0);
  const [dateTotalProfit, setDateTotalProfit] = useState(0);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [totalMonthlyProfit, setTotalMonthlyProfit] = useState(0);

  // Aplicar filtro de fecha
  useEffect(() => {
    if (selectedDate) {
      // Filtrar ventas por la fecha seleccionada
      const salesForDate = sales.filter(sale => sale.date === selectedDate);
      setFilteredSales(salesForDate);
      
      // Filtrar registros de impresión por la fecha seleccionada
      const recordsForDate = records.filter(record => record.date === selectedDate);
      setFilteredRecords(recordsForDate);
      
      // Calcular ganancias para la fecha seleccionada
      calculateProfitsForDate(salesForDate, recordsForDate);
    } else {
      // Sin filtro, mostrar ventas recientes
      const recent = [...sales]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
        
      setFilteredSales([]);
      setFilteredRecords([]);
      setRecentSales(recent);
      
      // Reiniciar las ganancias por fecha
      setDateProductsProfit(0);
      setDateServicesProfit(0);
      setDatePrintingProfit(0);
      setDateTotalProfit(0);
    }
  }, [selectedDate, sales, records, products, services]);

  // Calcular ganancias para la fecha seleccionada
  const calculateProfitsForDate = (filteredSales: any[], filteredRecords: any[]) => {
    // Ganancias de productos
    let productProfit = 0;
    let serviceProfit = 0;
    let printingProfit = 0;
    
    // Calcular ganancias de productos
    filteredSales.forEach(sale => {
      if (sale.type === 'product' && sale.items) {
        sale.items.forEach((item: any) => {
          if (!item.product_id) return;
          
          const product = products.find(p => p.id === item.product_id);
          if (!product) return;
          
          // Ganancia = (precio de venta - precio de compra) * cantidad
          const itemProfit = ((item.price - product.purchase_price) * item.quantity);
          productProfit += itemProfit;
        });
      }
      
      // Calcular ganancias de servicios
      if (sale.type === 'service' && sale.items) {
        // Para los servicios asumimos que el margen es alto (80% de ganancia)
        const profitMargin = 0.8;
        
        sale.items.forEach((item: any) => {
          // Ganancia = precio * cantidad * margen de ganancia
          const itemProfit = item.price * item.quantity * profitMargin;
          serviceProfit += itemProfit;
        });
      }
    });
    
    // Calcular ganancias de impresiones
    filteredRecords.forEach(record => {
      const totalSheets = record.copies + record.prints + record.damaged_sheets;
      const totalCost = totalSheets * record.cost_per_sheet;
      
      const copyIncome = (record.price_per_copy || 0) * record.copies;
      const printIncome = (record.price_per_print || 0) * record.prints;
      const totalIncome = copyIncome + printIncome;
      
      printingProfit += (totalIncome - totalCost);
    });
    
    // Actualizar los estados
    setDateProductsProfit(productProfit);
    setDateServicesProfit(serviceProfit);
    setDatePrintingProfit(printingProfit);
    setDateTotalProfit(productProfit + serviceProfit + printingProfit);
  };

  // Calcular las estadísticas de impresiones
  useEffect(() => {
    if (records.length > 0) {
      // Obtener la fecha actual en formato ISO (YYYY-MM-DD)
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Obtener la fecha del primer día del mes actual
      const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      
      // Calcular ganancias de hoy
      const todayRecords = records.filter(record => record.date === today);
      let todayProfit = 0;
      
      // Calcular ganancias del mes
      const monthRecords = records.filter(record => record.date >= firstDayOfMonth);
      let monthProfit = 0;
      
      // Función para calcular ganancias de un registro
      const calculateProfit = (record: any) => {
        const totalSheets = record.copies + record.prints + record.damaged_sheets;
        const totalCost = totalSheets * record.cost_per_sheet;
        
        const copyIncome = (record.price_per_copy || 0) * record.copies;
        const printIncome = (record.price_per_print || 0) * record.prints;
        const totalIncome = copyIncome + printIncome;
        
        return totalIncome - totalCost;
      };
      
      // Sumar ganancias de hoy
      todayRecords.forEach(record => {
        todayProfit += calculateProfit(record);
      });
      
      // Sumar ganancias del mes
      monthRecords.forEach(record => {
        monthProfit += calculateProfit(record);
      });
      
      setTodayPrintingProfit(todayProfit);
      setMonthlyPrintingProfit(monthProfit);
    }
  }, [records]);

  // Calcular ganancias de productos y servicios
  useEffect(() => {
    if (sales.length > 0 && products.length > 0 && services.length > 0) {
      // Obtener la fecha actual en formato ISO (YYYY-MM-DD)
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Obtener la fecha del primer día del mes actual
      const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      
      // Filtrar ventas por fecha y tipo
      const todayProductSales = sales.filter(sale => sale.date === today && sale.type === 'product');
      const monthProductSales = sales.filter(sale => sale.date >= firstDayOfMonth && sale.type === 'product');
      const todayServiceSales = sales.filter(sale => sale.date === today && sale.type === 'service');
      const monthServiceSales = sales.filter(sale => sale.date >= firstDayOfMonth && sale.type === 'service');
      
      // Función para calcular ganancia de producto
      const calculateProductProfit = (sale: any) => {
        if (!sale.items) return 0;
        
        return sale.items.reduce((profit: number, item: any) => {
          if (!item.product_id) return profit;
          
          const product = products.find(p => p.id === item.product_id);
          if (!product) return profit;
          
          // Ganancia = (precio de venta - precio de compra) * cantidad
          const itemProfit = ((item.price - product.purchase_price) * item.quantity);
          return profit + itemProfit;
        }, 0);
      };
      
      // Función para calcular ganancia de servicios (se asume que el costo es bajo o nulo)
      const calculateServiceProfit = (sale: any) => {
        if (!sale.items) return 0;
        
        // Para los servicios asumimos que el margen es alto (por ejemplo, 80% de ganancia)
        const profitMargin = 0.8;
        
        return sale.items.reduce((profit: number, item: any) => {
          // Ganancia = precio * cantidad * margen de ganancia
          const itemProfit = item.price * item.quantity * profitMargin;
          return profit + itemProfit;
        }, 0);
      };
      
      // Calcular ganancias
      let todayProducts = 0;
      let monthlyProducts = 0;
      let todayServices = 0;
      let monthlyServices = 0;
      
      todayProductSales.forEach(sale => {
        todayProducts += calculateProductProfit(sale);
      });
      
      monthProductSales.forEach(sale => {
        monthlyProducts += calculateProductProfit(sale);
      });
      
      todayServiceSales.forEach(sale => {
        todayServices += calculateServiceProfit(sale);
      });
      
      monthServiceSales.forEach(sale => {
        monthlyServices += calculateServiceProfit(sale);
      });
      
      setTodayProductsProfit(todayProducts);
      setMonthlyProductsProfit(monthlyProducts);
      setTodayServicesProfit(todayServices);
      setMonthlyServicesProfit(monthlyServices);
      
      // Calcular ganancia total mensual
      const totalProfit = monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit;
      setTotalMonthlyProfit(totalProfit);
      
      setLoadingStats(false);
    }
  }, [sales, products, services, records, monthlyPrintingProfit]);

  useEffect(() => {
    if (sales.length > 0 && products.length > 0) {
      const productSales: { [key: string]: number } = {};

      sales.forEach((sale) => {
        if (sale.type === "product" && sale.items) {
          sale.items.forEach((item) => {
            if (item.product_id) {
              productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
            }
          });
        }
      });

      const productPopularity = Object.entries(productSales)
        .map(([productId, count]) => {
          const product = products.find((p) => p.id === productId);
          return {
            name: product ? product.name : "Producto desconocido",
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setPopularProducts(productPopularity);

      // Si no hay filtro de fecha, mostrar las ventas recientes
      if (!selectedDate) {
        const recent = [...sales]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        setRecentSales(recent);
      }
    }
  }, [sales, products, selectedDate]);

  // Función para exportar todos los datos de ganancias a Excel
  const handleExportAllProfits = () => {
    exportAllProfitsToExcel(sales, products, services, records);
  };

  // Función para exportar datos de un día específico a Excel
  const handleExportDayProfits = (date: string) => {
    const dateFormatted = format(new Date(date), 'yyyy-MM-dd');
    // Filtrar datos por la fecha seleccionada
    const salesForDate = sales.filter(sale => sale.date === dateFormatted);
    const recordsForDate = records.filter(record => record.date === dateFormatted);
    
    // Exportar solo los datos de esa fecha
    exportAllProfitsToExcel(
      salesForDate, 
      products, 
      services, 
      recordsForDate, 
      `Ganancias_${format(new Date(date), 'dd-MM-yyyy')}.xlsx`
    );
  };

  // Calculate profit percentage change (mock data for demonstration)
  const profitChange = 12.5;
  const isPositiveChange = profitChange > 0;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visualiza el rendimiento de tu negocio</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateFilter 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onExportDate={handleExportDayProfits}
          />
          <button
            onClick={handleExportAllProfits}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>Exportar Todo</span>
          </button>
        </div>
      </div>

      {/* Sección de filtro por fecha */}
      {selectedDate && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200 border-l-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                Resultados para: {format(new Date(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredSales.length} ventas y {filteredRecords.length} registros de impresión
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col items-end">
              <div className="text-xl font-bold text-green-600">Ganancia Total: {formatMoney(dateTotalProfit)}</div>
              <div className="text-sm text-gray-600 mt-1">
                Productos: {formatMoney(dateProductsProfit)} • 
                Servicios: {formatMoney(dateServicesProfit)} • 
                Impresiones: {formatMoney(datePrintingProfit)}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading || loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Tarjetas de ganancias */}
          {!selectedDate ? (
            // Mostrar ganancias diarias y mensuales cuando no hay filtro
            <>
              {/* Primera fila - Ganancias diarias */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
                  <p className="text-sm font-medium text-gray-500">Ganancia productos (hoy)</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMoney(todayProductsProfit)}</span>
                    <div className="p-2 bg-blue-50 rounded-full">
                      <ShoppingCart className="text-blue-500 h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <Calendar className="text-gray-400 h-3 w-3 mr-1" />
                    <span className="text-gray-500">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</span>
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-purple-500">
                  <p className="text-sm font-medium text-gray-500">Ganancia servicios (hoy)</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMoney(todayServicesProfit)}</span>
                    <div className="p-2 bg-purple-50 rounded-full">
                      <Wrench className="text-purple-500 h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <Calendar className="text-gray-400 h-3 w-3 mr-1" />
                    <span className="text-gray-500">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</span>
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
                  <p className="text-sm font-medium text-gray-500">Ganancia impresiones (hoy)</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMoney(todayPrintingProfit)}</span>
                    <div className="p-2 bg-green-50 rounded-full">
                      <Printer className="text-green-500 h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <Calendar className="text-gray-400 h-3 w-3 mr-1" />
                    <span className="text-gray-500">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</span>
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-amber-500">
                  <p className="text-sm font-medium text-gray-500">Total ganancia hoy</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMoney(todayProductsProfit + todayServicesProfit + todayPrintingProfit)}</span>
                    <div className="p-2 bg-amber-50 rounded-full">
                      <DollarSign className="text-amber-500 h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <ArrowUpRight className="text-green-500 h-3 w-3 mr-1" />
                    <span className="text-green-500 font-medium">8.2%</span> más que ayer
                  </p>
                </div>
              </div>

              {/* Segunda fila - Ganancias mensuales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
                  <p className="text-sm font-medium text-gray-500">Ganancia productos (mes)</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMoney(monthlyProductsProfit)}</span>
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Package className="text-blue-500 h-5 w-5" />
                    </div>
                  </div>
                  <Link to="/sales?type=product" className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                    Ver ventas de productos
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-purple-500">
                  <p className="text-sm font-medium text-gray-500">Ganancia servicios (mes)</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMoney(monthlyServicesProfit)}</span>
                    <div className="p-2 bg-purple-50 rounded-full">
                      <FileText className="text-purple-500 h-5 w-5" />
                    </div>
                  </div>
                  <Link to="/services" className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                    Ver servicios
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
                  <p className="text-sm font-medium text-gray-500">Ganancia impresiones (mes)</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMoney(monthlyPrintingProfit)}</span>
                    <div className="p-2 bg-green-50 rounded-full">
                      <Printer className="text-green-500 h-5 w-5" />
                    </div>
                  </div>
                  <Link to="/printing" className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                    Ver impresiones
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-rose-500">
                  <p className="text-sm font-medium text-gray-500">Productos bajos en stock</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{stats.lowStockProducts}</span>
                    <div className="p-2 bg-rose-50 rounded-full">
                      <AlertTriangle className="text-rose-500 h-5 w-5" />
                    </div>
                  </div>
                  {stats.lowStockProducts > 0 ? (
                    <Link to="/products?filter=lowstock" className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                      Ver productos
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">Todos los productos tienen stock suficiente</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Mostrar detalle de ventas y ganancias del día filtrado
            <>
              {/* Tres tarjetas mostrando el desglose de ganancias para la fecha seleccionada */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ventas de productos</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatMoney(dateProductsProfit)}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-full">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {filteredSales.filter(s => s.type === 'product').length} ventas de productos
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ventas de servicios</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatMoney(dateServicesProfit)}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-full">
                      <Wrench className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {filteredSales.filter(s => s.type === 'service').length} ventas de servicios
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Impresiones y copias</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatMoney(datePrintingProfit)}
                      </p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-full">
                      <Printer className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {filteredRecords.length} registros de impresión
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedDate 
                ? `Ventas del ${format(new Date(selectedDate), "d 'de' MMMM", { locale: es })}` 
                : "Rendimiento Mensual"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDate 
                ? `Detalle de las ventas realizadas en la fecha seleccionada`
                : "Resumen de ventas, gastos y ganancias del mes actual"}
            </p>
          </div>
          
          {selectedDate ? (
            // Mostrar lista de ventas para la fecha seleccionada
            <div className="p-6">
              {filteredSales.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No hay ventas para esta fecha</h3>
                  <p className="text-sm text-gray-500 mt-1">Selecciona otra fecha o elimina el filtro</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSales.map((sale) => (
                    <div key={sale.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${sale.type === "product" ? "bg-blue-50" : "bg-purple-50"}`}>
                            {sale.type === "product" ? (
                              <ShoppingCart className={`h-5 w-5 text-blue-500`} />
                            ) : (
                              <Wrench className={`h-5 w-5 text-purple-500`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {sale.type === "product" ? "Venta de productos" : "Venta de servicios"}
                              {sale.customer_name && <span className="ml-1 text-gray-500">- {sale.customer_name}</span>}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(sale.date), "HH:mm")}
                              <span className="mx-1">•</span>
                              ID: {sale.id.slice(0, 8)}
                            </div>
                            {sale.items && (
                              <div className="mt-2 text-xs">
                                <span className="text-gray-500">Artículos:</span>
                                <ul className="mt-1 space-y-1">
                                  {sale.items.slice(0, 3).map((item: any, idx: number) => {
                                    // Buscar el nombre del producto o servicio
                                    let itemName = "Artículo";
                                    if (item.product_id) {
                                      const product = products.find(p => p.id === item.product_id);
                                      if (product) itemName = product.name;
                                    } else if (item.service_id) {
                                      const service = services.find(s => s.id === item.service_id);
                                      if (service) itemName = service.name;
                                    }
                                    
                                    return (
                                      <li key={idx} className="flex justify-between">
                                        <span>{itemName} (x{item.quantity})</span>
                                        <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
                                      </li>
                                    );
                                  })}
                                  {sale.items.length > 3 && (
                                    <li className="text-gray-500">
                                      +{sale.items.length - 3} más...
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-blue-600">{formatMoney(sale.total)}</span>
                          <p className="text-xs text-gray-500 mt-1">
                            {sale.items?.length || 0} {sale.type === "product" ? "productos" : "servicios"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Mostrar estadísticas mensuales
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1 flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Ventas
                  </p>
                  <p className="text-2xl font-bold text-blue-700">{formatMoney(stats.monthlySales)}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 font-medium mb-1 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Gastos
                  </p>
                  <p className="text-2xl font-bold text-red-700">{formatMoney(stats.monthlyExpenses)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-1 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Ganancia Total
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatMoney(monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit)}
                  </p>
                  <div className="flex items-center mt-1">
                    {isPositiveChange ? (
                      <ArrowUpRight className="text-green-600 h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="text-red-600 h-3 w-3 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${isPositiveChange ? "text-green-600" : "text-red-600"}`}>
                      {profitChange}% {isPositiveChange ? "más" : "menos"} que el mes pasado
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose de ganancias por tipo */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Desglose de ganancias mensuales</h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="space-y-4">
                    {/* Productos */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-700">Productos</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatMoney(monthlyProductsProfit)} 
                          <span className="text-gray-500 text-xs ml-1">
                            ({((monthlyProductsProfit / (monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit || 1)) * 100).toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{width: `${(monthlyProductsProfit / (monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit || 1)) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Servicios */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-700">Servicios</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatMoney(monthlyServicesProfit)}
                          <span className="text-gray-500 text-xs ml-1">
                            ({((monthlyServicesProfit / (monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit || 1)) * 100).toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{width: `${(monthlyServicesProfit / (monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit || 1)) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Impresiones */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-700">Impresiones</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatMoney(monthlyPrintingProfit)}
                          <span className="text-gray-500 text-xs ml-1">
                            ({((monthlyPrintingProfit / (monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit || 1)) * 100).toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{width: `${(monthlyPrintingProfit / (monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit || 1)) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {stats.monthlySales > 0 && (
                <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Margen de ganancia</p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (((monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit) / stats.monthlySales) * 100) > 20
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {(((monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit) / stats.monthlySales) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, ((monthlyProductsProfit + monthlyServicesProfit + monthlyPrintingProfit) / stats.monthlySales) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Un margen saludable debe estar por encima del 20%</p>
                </div>
              )}
            </div>
          )}
          
          <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2">
            <Link
              to="/sales"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Ver detalles de ventas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/printing"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Ver impresiones
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Ver servicios
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Productos Populares</h2>
            <p className="text-sm text-gray-500 mt-1">Los productos más vendidos este mes</p>
          </div>
          <div className="p-6">
            {popularProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No hay productos registrados</p>
              </div>
            ) : (
              <div className="space-y-5">
                {popularProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {product.count} {product.count === 1 ? "unidad" : "unidades"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <Link
              to="/products"
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full"
            >
              Ver todos los productos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Ventas recientes (solo cuando no hay filtro) */}
      {!selectedDate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Últimas Ventas</h2>
            <p className="text-sm text-gray-500 mt-1">Transacciones más recientes</p>
          </div>
          <div className="p-6">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No hay ventas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${sale.type === "product" ? "bg-blue-50" : "bg-purple-50"}`}>
                          {sale.type === "product" ? (
                            <ShoppingCart
                              className={`h-5 w-5 ${sale.type === "product" ? "text-blue-500" : "text-purple-500"}`}
                            />
                          ) : (
                            <Receipt
                              className={`h-5 w-5 ${sale.type === "product" ? "text-blue-500" : "text-purple-500"}`}
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {sale.type === "product" ? "Venta de productos" : "Venta de servicios"}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(sale.date), "dd/MM/yyyy HH:mm")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-blue-600">${sale.total.toFixed(2)}</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {sale.items?.length || 0} {sale.type === "product" ? "productos" : "servicios"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <Link
              to="/sales"
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full"
            >
              Ver todas las ventas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
      
      {/* Lista de registros de impresión (solo cuando hay filtro) */}
      {selectedDate && filteredRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Registros de Impresión del Día</h2>
            <p className="text-sm text-gray-500 mt-1">Impresiones y copias realizadas en esta fecha</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                // Calcular ganancias
                const totalSheets = record.copies + record.prints + record.damaged_sheets;
                const totalCost = totalSheets * record.cost_per_sheet;
                const copyIncome = (record.price_per_copy || 0) * record.copies;
                const printIncome = (record.price_per_print || 0) * record.prints;
                const totalIncome = copyIncome + printIncome;
                const profit = totalIncome - totalCost;
                const isProfitable = profit >= 0;
                
                return (
                  <div key={record.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-full bg-green-50">
                          <Printer className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {record.copies > 0 && record.prints > 0 
                              ? 'Copias e Impresiones' 
                              : record.copies > 0 ? 'Copias' : 'Impresiones'}
                          </h4>
                          <div className="mt-1 text-xs text-gray-500">
                            {record.copies > 0 && <span>{record.copies} copias</span>}
                            {record.copies > 0 && record.prints > 0 && <span className="mx-1">•</span>}
                            {record.prints > 0 && <span>{record.prints} impresiones</span>}
                            {(record.copies > 0 || record.prints > 0) && record.damaged_sheets > 0 && <span className="mx-1">•</span>}
                            {record.damaged_sheets > 0 && <span>{record.damaged_sheets} hojas dañadas</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfitable ? '+' : ''}{formatMoney(profit)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Costo: {formatMoney(totalCost)} • Ingreso: {formatMoney(totalIncome)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <Link
              to="/printing"
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full"
            >
              Ver todos los registros
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;