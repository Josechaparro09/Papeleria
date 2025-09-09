// src/hooks/useSalesWithCash.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sale, SaleItem, Product, Service } from '../types/database';
import toast from 'react-hot-toast';
import { normalizeToISODate } from '../utils/dateHelper';
import { useCashRegister } from './useCashRegister';

// Métodos de pago predefinidos
export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta de crédito',
  'Tarjeta de débito',
  'Transferencia',
  'Otro'
];

export function useSalesWithCash() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshStats } = useCashRegister();

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            quantity,
            price,
            subtotal,
            product_id,
            service_id,
            products (
              id,
              name,
              public_price
            ),
            services (
              id,
              name,
              price
            )
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ventas');
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }

  async function addSale(saleData: Omit<Sale, 'id' | 'created_at'>, items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]) {
    try {
      // Crear la venta
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Crear los items de la venta
      const saleItems = items.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Actualizar stock de productos si aplica
      for (const item of items) {
        if (item.product_id) {
          await reduceProductStock(item.product_id, item.quantity);
        }
      }

      // Actualizar estadísticas de caja
      await refreshStats();

      setSales(prev => [sale, ...prev]);
      toast.success('Venta registrada exitosamente');
      return sale;
    } catch (err) {
      toast.error('Error al registrar la venta');
      throw err;
    }
  }

  async function reduceProductStock(productId: string, quantity: number) {
    try {
      const { error } = await supabase.rpc('reduce_product_stock', {
        product_id: productId,
        quantity_to_reduce: quantity
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error reducing product stock:', err);
    }
  }

  async function updateSale(id: string, updates: Partial<Omit<Sale, 'id' | 'created_at'>>) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSales(prev => prev.map(sale => sale.id === id ? data : sale));
      await refreshStats();
      toast.success('Venta actualizada exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al actualizar la venta');
      throw err;
    }
  }

  async function deleteSale(id: string) {
    try {
      // Primero eliminar los items de la venta
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (itemsError) throw itemsError;

      // Luego eliminar la venta
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (saleError) throw saleError;

      setSales(prev => prev.filter(sale => sale.id !== id));
      await refreshStats();
      toast.success('Venta eliminada exitosamente');
    } catch (err) {
      toast.error('Error al eliminar la venta');
      throw err;
    }
  }

  // Funciones de búsqueda y filtrado
  function searchSales(query: string) {
    return sales.filter(sale => 
      sale.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
      sale.id.toLowerCase().includes(query.toLowerCase())
    );
  }

  function filterByDateRange(startDate: string, endDate: string) {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return saleDate >= start && saleDate <= end;
    });
  }

  function filterByPaymentMethod(method: string) {
    return sales.filter(sale => sale.payment_method === method);
  }

  // Estadísticas
  function getStats() {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const todaySales = sales.filter(sale => {
      const today = new Date().toISOString().split('T')[0];
      return sale.date === today;
    });
    const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);

    return {
      totalSales,
      totalRevenue,
      todaySales: todaySales.length,
      todayRevenue,
      averageSale: totalSales > 0 ? totalRevenue / totalSales : 0
    };
  }

  return {
    sales,
    loading,
    error,
    addSale,
    updateSale,
    deleteSale,
    searchSales,
    filterByDateRange,
    filterByPaymentMethod,
    getStats,
    refetch: fetchSales
  };
}
