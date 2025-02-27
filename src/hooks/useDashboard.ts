import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Ensure this matches the Product type in your database
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
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

      // Daily sales
      const { data: dailySales, error: dailyError } = await supabase
        .from('sales')
        .select('total')
        .eq('date', today);

      if (dailyError) throw dailyError;

      // Monthly sales (total, by type, and top selling products)
      const { data: monthlySalesData, error: monthlySalesError } = await supabase
        .from('sales')
        .select(`
          total,
          type,
          items:sale_items(quantity, price, product_id)
        `)
        .gte('date', firstDayOfMonth);

      if (monthlySalesError) throw monthlySalesError;

      // Monthly expenses
      const { data: monthlyExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', firstDayOfMonth);

      if (expensesError) throw expensesError;

      // Low stock products
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, stock, min_stock, name');
        
      if (productsError) throw productsError;

      // Ensure type safety
      const typedProducts = allProducts as ProductWithStock[];

      // Calculate sales statistics
      const monthlySalesTotal = monthlySalesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;
      const monthlyServiceSales = monthlySalesData
        ?.filter(sale => sale.type === 'service')
        .reduce((sum, sale) => sum + sale.total, 0) || 0;
      const monthlyProductSales = monthlySalesData
        ?.filter(sale => sale.type === 'product')
        .reduce((sum, sale) => sum + sale.total, 0) || 0;

      // Calculate top selling products
      const productSales: { [key: string]: number } = {};
      monthlySalesData
        ?.filter(sale => sale.type === 'product')
        .forEach(sale => {
          sale.items?.forEach(item => {
            if (item.product_id) {
              productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
            }
          });
        });

      // Get product names for top selling products
      const topSellingProducts = Object.entries(productSales)
        .map(([productId, total_quantity]) => {
          const product = typedProducts.find(p => p.id === productId);
          return {
            name: product?.name || 'Producto desconocido',
            total_quantity
          };
        })
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      // Calculate low stock products
      const lowStockCount = typedProducts ? 
        typedProducts.filter(product => product.stock <= product.min_stock).length : 0;

      // Calculate monthly expenses
      const monthlyExpensesTotal = monthlyExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      // Calculate profit margin
      const profitMargin = monthlySalesTotal > 0 
        ? ((monthlySalesTotal - monthlyExpensesTotal) / monthlySalesTotal) * 100 
        : 0;

      setStats({
        dailySales: dailySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0,
        monthlySales: monthlySalesTotal,
        monthlyServiceSales,
        monthlyProductSales,
        monthlyExpenses: monthlyExpensesTotal,
        lowStockProducts: lowStockCount,
        topSellingProducts,
        profitMargin
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      toast.error('Error al cargar estadísticas del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  return {
    stats,
    loading,
    error,
    fetchDashboardStats
  };
}