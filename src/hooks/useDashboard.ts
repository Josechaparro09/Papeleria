import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import toast from "react-hot-toast";

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
  monthlyPrintingRevenue: number; // Nuevo campo para ingresos totales de impresiones
}

export function useDashboard() {
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
    monthlyPrintingRevenue: 0, // Inicializado
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

      // Daily sales
      const { data: dailySales } = await supabase
        .from("sales")
        .select("total")
        .eq("date", today);

      // Monthly sales (total, by type, and top selling products)
      const { data: monthlySalesData } = await supabase
        .from("sales")
        .select(`
          total,
          type,
          items:sale_items(quantity, price, product_id)
        `)
        .gte("date", firstDayOfMonth);

      // Monthly expenses
      const { data: monthlyExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", firstDayOfMonth);

      // Low stock products
      const { data: allProducts } = await supabase
        .from("products")
        .select("id, stock, min_stock, name");

      // Printing records - daily
      const { data: dailyPrinting } = await supabase
        .from("printing_records")
        .select("*")
        .eq("date", today);

      // Printing records - monthly
      const { data: monthlyPrinting } = await supabase
        .from("printing_records")
        .select("*")
        .gte("date", firstDayOfMonth);

      const typedProducts = allProducts as ProductWithStock[];

      // Calculate sales statistics
      const monthlySalesTotal = monthlySalesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;
      const monthlyServiceSales = monthlySalesData
        ?.filter((sale) => sale.type === "service")
        .reduce((sum, sale) => sum + sale.total, 0) || 0;
      const monthlyProductSales = monthlySalesData
        ?.filter((sale) => sale.type === "product")
        .reduce((sum, sale) => sum + sale.total, 0) || 0;

      // Calculate printing revenue and profit
      const dailyPrintingProfit = calculatePrintingProfit(dailyPrinting || []);
      const monthlyPrintingProfit = calculatePrintingProfit(monthlyPrinting || []);
      const monthlyPrintingRevenue = calculatePrintingRevenue(monthlyPrinting || []); // Nuevo cálculo

      // Calculate top selling products
      const productSales: { [key: string]: number } = {};
      monthlySalesData
        ?.filter((sale) => sale.type === "product")
        .forEach((sale) => {
          sale.items?.forEach((item) => {
            if (item.product_id) {
              productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
            }
          });
        });

      const topSellingProducts = Object.entries(productSales)
        .map(([productId, total_quantity]) => {
          const product = typedProducts.find((p) => p.id === productId);
          return {
            name: product?.name || "Producto desconocido",
            total_quantity,
          };
        })
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      const lowStockCount = typedProducts
        ? typedProducts.filter((product) => product.stock <= product.min_stock).length
        : 0;

      const monthlyExpensesTotal = monthlyExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      // Total revenue includes sales and printing revenue
      const totalRevenue = monthlySalesTotal + monthlyPrintingRevenue;
      const totalProfit = monthlySalesTotal - monthlyExpensesTotal + monthlyPrintingProfit; // Ajustado para ganancias
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      setStats({
        dailySales: dailySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0,
        monthlySales: monthlySalesTotal,
        monthlyServiceSales,
        monthlyProductSales,
        monthlyExpenses: monthlyExpensesTotal,
        lowStockProducts: lowStockCount,
        topSellingProducts,
        profitMargin,
        dailyPrintingProfit,
        monthlyPrintingProfit,
        monthlyPrintingRevenue, // Nuevo campo
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar estadísticas");
      toast.error("Error al cargar estadísticas del dashboard");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  function calculatePrintingProfit(records: any[]): number {
    return records.reduce((total, record) => {
      const totalSheets = record.copies + record.prints + record.damaged_sheets;
      const totalCost = totalSheets * record.cost_per_sheet;
      const copyIncome = (record.price_per_copy || 0) * record.copies;
      const printIncome = (record.price_per_print || 0) * record.prints;
      const totalIncome = copyIncome + printIncome;
      return total + (totalIncome - totalCost);
    }, 0);
  }

  // Nueva función para calcular ingresos totales de impresiones
  function calculatePrintingRevenue(records: any[]): number {
    return records.reduce((total, record) => {
      const copyIncome = (record.price_per_copy || 0) * record.copies;
      const printIncome = (record.price_per_print || 0) * record.prints;
      return total + (copyIncome + printIncome);
    }, 0);
  }

  return {
    stats,
    loading,
    error,
    fetchDashboardStats,
  };
}