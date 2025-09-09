// src/hooks/useDashboardWithCash.ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useCashRegister } from "./useCashRegister";

interface ProductWithStock {
  id: string;
  stock: number;
  min_stock: number;
  name: string;
}

interface DashboardStats {
  dailySales: number;
  monthlySales: number;
  monthlyServiceSales: number;
  monthlyProductSales: number;
  monthlyExpenses: number;
  lowStockProducts: number;
  topSellingProducts: { name: string; total_quantity: number }[];
  profitMargin: number;
  dailyPrintingProfit: number;
  monthlyPrintingProfit: number;
  monthlyPrintingRevenue: number;
  // Nuevas estadísticas de caja
  cashRegisterOpen: boolean;
  currentBalance: number;
  todayRecharges: number;
  todaySublimationSales: number;
}

export function useDashboardWithCash(startDate?: string, endDate?: string) {
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    monthlySales: 0,
    monthlyServiceSales: 0,
    monthlyProductSales: 0,
    monthlyExpenses: 0,
    lowStockProducts: 0,
    topSellingProducts: [],
    profitMargin: 0,
    dailyPrintingProfit: 0,
    monthlyPrintingProfit: 0,
    monthlyPrintingRevenue: 0,
    cashRegisterOpen: false,
    currentBalance: 0,
    todayRecharges: 0,
    todaySublimationSales: 0
  });
  const [loading, setLoading] = useState(true);
  const { isOpen, stats: cashStats, refreshStats } = useCashRegister();

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  useEffect(() => {
    // Actualizar estadísticas cuando cambie el estado de la caja
    setStats(prev => ({
      ...prev,
      cashRegisterOpen: isOpen,
      currentBalance: cashStats.currentBalance,
      todayRecharges: cashStats.totalRecharges
    }));
  }, [isOpen, cashStats]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
      const endOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

      const dateFilter = startDate && endDate ? { startDate, endDate } : { startDate: startOfMonth, endDate: endOfMonth };

      // Obtener ventas del día
      const { data: dailySalesData, error: dailySalesError } = await supabase
        .from("sales")
        .select("total")
        .eq("date", today);

      if (dailySalesError) throw dailySalesError;

      // Obtener ventas del mes
      const { data: monthlySalesData, error: monthlySalesError } = await supabase
        .from("sales")
        .select("total, type")
        .gte("date", dateFilter.startDate)
        .lte("date", dateFilter.endDate);

      if (monthlySalesError) throw monthlySalesError;

      // Obtener gastos del mes
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", dateFilter.startDate)
        .lte("date", dateFilter.endDate);

      if (expensesError) throw expensesError;

      // Obtener productos con stock bajo
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, stock, min_stock")
        .lte("stock", supabase.raw("min_stock"));

      if (productsError) throw productsError;

      // Obtener productos más vendidos
      const { data: topProductsData, error: topProductsError } = await supabase
        .from("sale_items")
        .select(`
          quantity,
          products!inner(name)
        `)
        .gte("created_at", dateFilter.startDate)
        .lte("created_at", dateFilter.endDate);

      if (topProductsError) throw topProductsError;

      // Obtener registros de impresión del mes
      const { data: printingData, error: printingError } = await supabase
        .from("printing_records")
        .select("subtotal, cost_per_sheet, copies, prints")
        .gte("date", dateFilter.startDate)
        .lte("date", dateFilter.endDate);

      if (printingError) throw printingError;

      // Obtener ventas de sublimación del día
      const { data: sublimationSalesData, error: sublimationError } = await supabase
        .from("sublimation_sales")
        .select("total")
        .eq("date", today);

      if (sublimationError) throw sublimationError;

      // Calcular estadísticas
      const dailySales = dailySalesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const monthlySales = monthlySalesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const monthlyServiceSales = monthlySalesData?.filter(sale => sale.type === 'service').reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const monthlyProductSales = monthlySalesData?.filter(sale => sale.type === 'product').reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const monthlyExpenses = expensesData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const lowStockProducts = productsData?.length || 0;

      // Calcular productos más vendidos
      const productSalesMap = new Map<string, { name: string; total_quantity: number }>();
      topProductsData?.forEach(item => {
        const productName = item.products?.name || 'Producto desconocido';
        const current = productSalesMap.get(productName) || { name: productName, total_quantity: 0 };
        current.total_quantity += item.quantity;
        productSalesMap.set(productName, current);
      });
      const topSellingProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      // Calcular ganancias de impresión
      const printingRevenue = printingData?.reduce((sum, record) => sum + Number(record.subtotal || 0), 0) || 0;
      const printingCosts = printingData?.reduce((sum, record) => {
        const copies = record.copies || 0;
        const prints = record.prints || 0;
        const costPerSheet = Number(record.cost_per_sheet || 0);
        return sum + ((copies + prints) * costPerSheet);
      }, 0) || 0;
      const monthlyPrintingProfit = printingRevenue - printingCosts;
      const dailyPrintingProfit = monthlyPrintingProfit / new Date().getDate();
      const monthlyPrintingRevenue = printingRevenue;

      // Calcular margen de ganancia
      const profitMargin = monthlySales > 0 ? ((monthlySales - monthlyExpenses) / monthlySales) * 100 : 0;

      // Calcular ventas de sublimación del día
      const todaySublimationSales = sublimationSalesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      setStats({
        dailySales,
        monthlySales,
        monthlyServiceSales,
        monthlyProductSales,
        monthlyExpenses,
        lowStockProducts,
        topSellingProducts,
        profitMargin,
        dailyPrintingProfit,
        monthlyPrintingProfit,
        monthlyPrintingRevenue,
        cashRegisterOpen: isOpen,
        currentBalance: cashStats.currentBalance,
        todayRecharges: cashStats.totalRecharges,
        todaySublimationSales
      });

      // Actualizar estadísticas de caja
      await refreshStats();
    } catch (err) {
      toast.error("Error al cargar estadísticas del dashboard");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  return {
    stats,
    loading,
    refetch: fetchDashboardData
  };
}
