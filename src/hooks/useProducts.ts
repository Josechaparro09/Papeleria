import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import toast from 'react-hot-toast';

// Categorías predefinidas
export const PRODUCT_CATEGORIES = [
  'Papelería',
  'Oficina',
  'Escolares',
  'Impresión',
  'Tecnología',
  'Regalos',
  'Otros'
];

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
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar productos';
      
      console.error('Fetch Products Error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function addProduct(product: {
    name: string;
    description?: string | null;
    category?: string | null;
    purchase_price?: number | null;
    public_price?: number | null;
    stock: number;
    min_stock: number;
    barcode?: string | null;
  }) {
    try {
      // Prepare data, explicitly handling optional fields
      const productData = Object.fromEntries(
        Object.entries({
          name: product.name,
          description: product.description || null,
          category: product.category || null,
          purchase_price: product.purchase_price ?? null,
          public_price: product.public_price ?? null,
          stock: product.stock,
          min_stock: product.min_stock,
          barcode: product.barcode || null
        }).filter(([_, v]) => v !== undefined)
      );

      console.log('Inserting product data:', productData);

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }
      
      setProducts(prevProducts => [...prevProducts, data]);
      toast.success('Producto agregado exitosamente');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al agregar el producto';
      
      console.error('Add Product Error:', err);
      toast.error(errorMessage);
      throw err;
    }
  }

  async function updateProduct(id: string, updates: {
    name?: string;
    description?: string | null;
    category?: string | null;
    purchase_price?: number | null;
    public_price?: number | null;
    stock?: number;
    min_stock?: number;
    barcode?: string | null;
  }) {
    try {
      // Prepare updates, explicitly handling optional fields
      const productUpdates = Object.fromEntries(
        Object.entries({
          ...updates,
          description: updates.description || null,
          category: updates.category || null,
          purchase_price: updates.purchase_price ?? null,
          public_price: updates.public_price ?? null,
          barcode: updates.barcode || null,
        }).filter(([_, v]) => v !== undefined)
      );

      const { data, error } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase Update Error:', error);
        throw error;
      }
      
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === id ? data : p)
      );
      
      toast.success('Producto actualizado exitosamente');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al actualizar el producto';
      
      console.error('Update Product Error:', err);
      toast.error(errorMessage);
      throw err;
    }
  }

  async function deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase Delete Error:', error);
        throw error;
      }
      
      setProducts(prevProducts => 
        prevProducts.filter(p => p.id !== id)
      );
      
      toast.success('Producto eliminado exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al eliminar el producto';
      
      console.error('Delete Product Error:', err);
      toast.error(errorMessage);
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