import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sale, SaleItem, SublimationSaleProduct, Product, Service, SublimationService } from '../types/database';
import toast from 'react-hot-toast';

// Métodos de pago predefinidos
export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta de crédito',
  'Tarjeta de débito',
  'Transferencia',
  'Otro'
];

export function useUniversalSales() {
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
          items:sale_items(
            *,
            product:products(*),
            service:services(*),
            sublimation_service:sublimation_services(*)
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar ventas';
      
      console.error('Fetch Sales Error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function addSale(
    saleData: {
      date: string;
      subtotal: number;
      discount?: number;
      tax?: number;
      customer_name?: string;
      customer_phone?: string;
      customer_email?: string;
      payment_method?: 'Efectivo' | 'Tarjeta de crédito' | 'Tarjeta de débito' | 'Transferencia' | 'Otro';
      amount_paid?: number;
      change_amount?: number;
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      notes?: string;
    },
    items: {
      item_type: 'product' | 'service' | 'sublimation';
      product_id?: string;
      service_id?: string;
      sublimation_service_id?: string;
      item_name: string;
      description?: string;
      quantity: number;
      unit_price: number;
    }[]
  ) {
    try {
      // Calcular total
      const total = saleData.subtotal - (saleData.discount || 0) + (saleData.tax || 0);

      // Crear la venta
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          ...saleData,
          total,
          status: saleData.status || 'completed'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Crear los items de la venta
      const itemsWithSaleId = items.map(item => ({
        ...item,
        sale_id: sale.id,
        subtotal: item.quantity * item.unit_price
      }));

      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId)
        .select();

      if (itemsError) throw itemsError;

      // Actualizar el estado local
      const newSale = {
        ...sale,
        items: saleItems.map(item => ({
          ...item,
          created_at: new Date().toISOString()
        }))
      };

      setSales(prev => [newSale, ...prev]);
      toast.success('Venta registrada exitosamente');
      return sale;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al registrar venta';
      
      console.error('Add Sale Error:', err);
      toast.error(errorMessage);
      throw err;
    }
  }

  async function deleteSale(id: string) {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSales(prev => prev.filter(sale => sale.id !== id));
      toast.success('Venta eliminada exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al eliminar venta';
      
      console.error('Delete Sale Error:', err);
      toast.error(errorMessage);
      throw err;
    }
  }

  async function getSaleById(id: string): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(
            *,
            product:products(*),
            service:services(*),
            sublimation_service:sublimation_services(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Get Sale Error:', err);
      return null;
    }
  }

  return {
    sales,
    loading,
    error,
    fetchSales,
    addSale,
    deleteSale,
    getSaleById
  };
}
