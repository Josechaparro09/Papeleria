//scr/hooks/useSales.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sale, SaleItem } from '../types/database';
import toast from 'react-hot-toast';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          items:sale_items(*)
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

  async function addSale(sale: Omit<Sale, 'id' | 'created_at'>, items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]) {
    try {
      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([sale])
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const saleItems = items.map(item => ({
        ...item,
        sale_id: saleData.id
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Refresh sales list
      await fetchSales();
      toast.success('Venta registrada exitosamente');
      return saleData;
    } catch (err) {
      toast.error('Error al registrar la venta');
      throw err;
    }
  }

  async function deleteSale(id: string) {
    try {
      // Delete sale items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (itemsError) throw itemsError;

      // Delete sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (saleError) throw saleError;

      setSales(sales.filter(s => s.id !== id));
      toast.success('Venta eliminada exitosamente');
    } catch (err) {
      toast.error('Error al eliminar la venta');
      throw err;
    }
  }

  return {
    sales,
    loading,
    error,
    fetchSales,
    addSale,
    deleteSale
  };
}