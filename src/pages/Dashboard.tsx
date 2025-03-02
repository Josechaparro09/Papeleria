import { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  Printer,
  Wrench,
  ArrowRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { useSales } from "../hooks/useSales";
import { useProducts } from "../hooks/useProducts";
import { useServices } from "../hooks/useServices";
import { usePrintingRecords } from "../hooks/usePrintingRecords";
import { useExpenses } from "../hooks/useExpenses";
import { Link } from "react-router-dom";
import formatMoney from "../utils/format";
import { exportAllProfitsToExcel } from "../utils/excelExport";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function Dashboard() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("month");
  const { stats, loading } = useDashboard(startDate, endDate);
  const { sales } = useSales();
  const { products } = useProducts();
  const { services } = useServices();
  const { records } = usePrintingRecords();
  const { expenses, loading: expensesLoading } = useExpenses();

  const [monthlyProfit, setMonthlyProfit] = useState({
    products: 0,
    services: 0,
    printing: 0,
    total: 0,
  });

  // Set date range based on filter type
  const setDateRange = (type: string) => {
    const today = new Date();
    let newStartDate = "";
    let newEndDate = format(today, "yyyy-MM-dd");

    switch (type) {
      case "today":
        newStartDate = newEndDate;
        break;
      case "week":
        newStartDate = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "month":
        newStartDate = format(startOfMonth(today), "yyyy-MM-dd");
        break;
      default:
        newStartDate = "";
        newEndDate = "";
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setFilterType(type);
  };

  useEffect(() => {
    setDateRange("month");
  }, []);

  // Calculate profits in the selected range
  useEffect(() => {
    if (sales.length > 0 && products.length > 0 && services.length > 0 && records.length > 0) {
      const filteredSales = sales.filter((sale) => 
        (!startDate || sale.date >= startDate) && (!endDate || sale.date <= endDate)
      );
      const filteredRecords = records.filter((record) => 
        (!startDate || record.date >= startDate) && (!endDate || record.date <= endDate)
      );

      const productProfit = filteredSales
        .filter((sale) => sale.type === "product")
        .reduce((sum, sale) => {
          return (
            sum +
            (sale.items?.reduce((acc: number, item: any) => {
              const product = products.find((p) => p.id === item.product_id);
              return acc + ((item.price - (product?.purchase_price || 0)) * item.quantity);
            }, 0) || 0)
          );
        }, 0);

      const serviceProfit = filteredSales
        .filter((sale) => sale.type === "service")
        .reduce((sum, sale) => {
          return (
            sum +
            (sale.items?.reduce((acc: number, item: any) => acc + item.price * item.quantity * 0.8, 0) || 0)
          );
        }, 0);

      const printingProfit = filteredRecords.reduce((sum, record) => {
        const totalSheets = record.copies + record.prints + record.damaged_sheets;
        const totalCost = totalSheets * record.cost_per_sheet;
        const copyIncome = (record.price_per_copy || 0) * record.copies;
        const printIncome = (record.price_per_print || 0) * record.prints;
        return sum + (copyIncome + printIncome - totalCost);
      }, 0);

      setMonthlyProfit({
        products: productProfit,
        services: serviceProfit,
        printing: printingProfit,
        total: productProfit + serviceProfit + printingProfit,
      });
    }
  }, [sales, products, services, records, startDate, endDate]);

  const chartData = [
    { name: "Productos", ventas: stats.monthlyProductSales, color: "#3B82F6" },
    { name: "Servicios", ventas: stats.monthlyServiceSales, color: "#8B5CF6" },
    { name: "Impresiones", ventas: stats.monthlyPrintingRevenue, color: "#10B981" },
  ];

  const totalRevenue = stats.monthlySales + stats.monthlyPrintingRevenue;
  const profitMargin = totalRevenue > 0 ? (monthlyProfit.total / totalRevenue) * 100 : 0;
  const profitability = monthlyProfit.total - stats.monthlyExpenses; // Profitability calculation

  const handleExportAll = () => {
    const success = exportAllProfitsToExcel(sales, products, services, records, undefined, startDate, endDate);
    if (!success) alert("Error al exportar el reporte completo.");
  };

  const recentExpenses = expenses.slice(0, 3);

  return (
    <div className="space-y-6 p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen de tu negocio</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hoy</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setFilterType("");
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span>-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFilterType("");
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleExportAll}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <span>Exportar Rango</span>
          </button>
        </div>
      </div>

      {loading || expensesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Ventas */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="mr-2 text-blue-600" size={24} />
              Ventas
            </h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                  <Bar dataKey="ventas" fill="#8884d8" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Bar key={index} dataKey={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatMoney(stats.monthlySales + stats.monthlyPrintingRevenue)}
              </span>
            </div>
            <Link
              to="/sales"
              className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              Ver detalles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Ganancias */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DollarSign className="mr-2 text-green-600" size={24} />
              Ganancias
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Productos:</span>
                </div>
                <span className="text-sm font-medium">{formatMoney(monthlyProfit.products)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wrench className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-sm text-gray-600">Servicios:</span>
                </div>
                <span className="text-sm font-medium">{formatMoney(monthlyProfit.services)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Printer className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Impresiones:</span>
                </div>
                <span className="text-sm font-medium">{formatMoney(monthlyProfit.printing)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-sm font-semibold text-gray-700">Total:</span>
                <span className="text-xl font-bold text-green-600">{formatMoney(monthlyProfit.total)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Margen de ganancia:</span>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  profitMargin > 20 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DollarSign className="mr-2 text-red-600" size={24} />
              Gastos
            </h2>
            <div className="mt-4">
              <p className="text-2xl font-bold text-red-600">{formatMoney(stats.monthlyExpenses)}</p>
              <p className="text-sm text-gray-500 mt-1">Total de gastos</p>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Últimos 3 Gastos</h3>
              {recentExpenses.length > 0 ? (
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="text-sm text-gray-600">{expense.description}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(expense.date), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {formatMoney(expense.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay gastos registrados</p>
              )}
            </div>
            <Link
              to="/expenses"
              className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todos los gastos <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Rentabilidad */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="mr-2 text-teal-600" size={24} />
              Rentabilidad
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ganancias Totales:</span>
                <span className="text-sm font-medium text-green-600">{formatMoney(monthlyProfit.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gastos Totales:</span>
                <span className="text-sm font-medium text-red-600">{formatMoney(stats.monthlyExpenses)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-sm font-semibold text-gray-700">Rentabilidad Neta:</span>
                <span
                  className={`text-xl font-bold ${
                    profitability >= 0 ? "text-teal-600" : "text-red-600"
                  }`}
                >
                  {formatMoney(profitability)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {profitability >= 0
                  ? "El negocio está generando ganancias."
                  : "El negocio está operando con pérdidas."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;