import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sale, SaleItem, Product, Service } from '../types/database';
import toast from 'react-hot-toast';

// Métodos de pago predefinidos
export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta de crédito',
  'Tarjeta de débito',
  'Transferencia',
  'Otro'
];

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

      console.log('Sales:', data);

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
      total: number;
      type: 'product' | 'service';
      customer_name?: string | null;
      payment_method?: string | null;
    }, 
    items: {
      product_id?: string;
      service_id?: string;
      quantity: number;
      price: number;
    }[]
  ) {
    try {
      // Prepare sale data, handling optional fields
      const preparedSaleData = Object.fromEntries(
        Object.entries({
          date: saleData.date,
          total: saleData.total,
          type: saleData.type,
          customer_name: saleData.customer_name || null,
          payment_method: saleData.payment_method || null
        }).filter(([_, v]) => v !== undefined)
      );

      // Start a transaction
      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([preparedSaleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Prepare sale items with subtotal
      const saleItems = items.map(item => ({
        sale_id: saleResult.id,
        product_id: item.product_id || null,
        service_id: item.service_id || null,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price
      }));

      // Insert sale items
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock if sale is for products
      if (saleData.type === 'product') {
        await updateProductStock(items);
      }

      // Refresh sales list
      await fetchSales();

      toast.success('Venta registrada exitosamente');
      return saleResult;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al registrar la venta';
      
      console.error('Add Sale Error:', err);
      toast.error(errorMessage);
      throw err;
    }
  }

  async function updateProductStock(items: {
    product_id?: string;
    quantity: number;
  }[]) {
    try {
      // Reduce stock for each product
      const stockUpdates = items
        .filter(item => item.product_id)
        .map(async (item) => {
          const { error } = await supabase
            .rpc('reduce_product_stock', { 
              p_product_id: item.product_id, 
              p_quantity: item.quantity 
            });

          if (error) throw error;
        });

      await Promise.all(stockUpdates);
    } catch (err) {
      console.error('Stock Update Error:', err);
      toast.error('Error al actualizar el stock');
      throw err;
    }
  }

  async function deleteSale(id: string) {
    try {
      // First, delete sale items
      const { error: itemsDeleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (itemsDeleteError) throw itemsDeleteError;

      // Then delete the sale
      const { error: saleDeleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (saleDeleteError) throw saleDeleteError;

      // Refresh sales list
      await fetchSales();

      toast.success('Venta eliminada exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al eliminar la venta';
      
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
          items:sale_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar la venta';
      
      console.error('Get Sale Error:', err);
      toast.error(errorMessage);
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