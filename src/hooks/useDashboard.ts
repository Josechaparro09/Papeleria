import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DashboardStats {
  dailySales: number;
  monthlySales: number;
  monthlyExpenses: number;
  lowStockProducts: number;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    monthlySales: 0,
    monthlyExpenses: 0,
    lowStockProducts: 0
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

      // Get daily sales
      const { data: dailySales, error: dailyError } = await supabase
        .from('sales')
        .select('total')
        .eq('date', today);

      if (dailyError) throw dailyError;

      // Get monthly sales
      const { data: monthlySales, error: monthlyError } = await supabase
        .from('sales')
        .select('total')
        .gte('date', firstDayOfMonth);

      if (monthlyError) throw monthlyError;

      // Get monthly expenses
      const { data: monthlyExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', firstDayOfMonth);

      if (expensesError) throw expensesError;

      // Get low stock products - Versión corregida
      // Obtenemos todos los productos y filtramos en el cliente
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('stock, min_stock');
        
      if (productsError) throw productsError;
      
      // Filtrar los productos con bajo stock en el cliente
      const lowStockCount = allProducts ? 
        allProducts.filter(product => product.stock <= product.min_stock).length : 0;

      setStats({
        dailySales: dailySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0,
        monthlySales: monthlySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0,
        monthlyExpenses: monthlyExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0,
        lowStockProducts: lowStockCount
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