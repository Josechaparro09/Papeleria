//scr/hooks/useExpenses.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types/database';
import toast from 'react-hot-toast';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar gastos');
      toast.error('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  }

  async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) throw error;
      setExpenses([data, ...expenses]);
      toast.success('Gasto registrado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al registrar el gasto');
      throw err;
    }
  }

  async function updateExpense(id: string, updates: Partial<Expense>) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setExpenses(expenses.map(e => e.id === id ? data : e));
      toast.success('Gasto actualizado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al actualizar el gasto');
      throw err;
    }
  }

  async function deleteExpense(id: string) {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Gasto eliminado exitosamente');
    } catch (err) {
      toast.error('Error al eliminar el gasto');
      throw err;
    }
  }

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense
  };
}