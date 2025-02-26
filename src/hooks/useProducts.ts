//scr/hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import toast from 'react-hot-toast';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }

  async function addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      setProducts([...products, data]);
      toast.success('Producto agregado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al agregar el producto');
      throw err;
    }
  }

  async function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProducts(products.map(p => p.id === id ? data : p));
      toast.success('Producto actualizado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al actualizar el producto');
      throw err;
    }
  }

  async function deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      toast.success('Producto eliminado exitosamente');
    } catch (err) {
      toast.error('Error al eliminar el producto');
      throw err;
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
}