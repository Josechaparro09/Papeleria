// src/hooks/useRecharges.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Recharge } from '../types/database';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function useRecharges() {
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [todayRecharge, setTodayRecharge] = useState<Recharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecharges();
  }, []);

  async function fetchRecharges() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      setRecharges(data || []);
      
      // Buscar la recarga de hoy
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRechargeData = data?.find(recharge => recharge.date === today) || null;
      setTodayRecharge(todayRechargeData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recargas');
      toast.error('Error al cargar datos de recargas');
    } finally {
      setLoading(false);
    }
  }

  async function addRecharge(recharge: Omit<Recharge, 'id' | 'created_at' | 'sales_amount'>) {
    try {
      // Calcular automáticamente el monto de ventas (opening - closing)
      const salesAmount = recharge.opening_balance - recharge.closing_balance;
      
      const { data, error } = await supabase
        .from('recharges')
        .insert([{
          ...recharge,
          sales_amount: salesAmount
        }])
        .select()
        .single();

      if (error) throw error;
      
      setRecharges([data, ...recharges]);
      setTodayRecharge(data);
      
      toast.success('Registro de recargas añadido exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al registrar datos de recargas');
      throw err;
    }
  }

  async function updateRecharge(id: string, updates: Partial<Omit<Recharge, 'id' | 'created_at'>>) {
    try {
      // Si se actualiza saldo inicial o final, recalcular el monto de ventas
      let updateData = { ...updates };
      
      if (updates.opening_balance !== undefined || updates.closing_balance !== undefined) {
        // Obtener los valores actuales si no se proporcionan
        const currentRecharge = recharges.find(r => r.id === id);
        if (!currentRecharge) throw new Error('Registro no encontrado');
        
        const openingBalance = updates.opening_balance ?? currentRecharge.opening_balance;
        const closingBalance = updates.closing_balance ?? currentRecharge.closing_balance;
        
        // Recalcular ventas
        updateData.sales_amount = openingBalance - closingBalance;
      }
      
      const { data, error } = await supabase
        .from('recharges')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRecharges(recharges.map(r => r.id === id ? data : r));
      
      // Actualizar todayRecharge si corresponde
      if (todayRecharge && todayRecharge.id === id) {
        setTodayRecharge(data);
      }
      
      toast.success('Registro de recargas actualizado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al actualizar registro de recargas');
      throw err;
    }
  }

  async function deleteRecharge(id: string) {
    try {
      const { error } = await supabase
        .from('recharges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const updatedRecharges = recharges.filter(r => r.id !== id);
      setRecharges(updatedRecharges);
      
      // Actualizar todayRecharge si corresponde
      if (todayRecharge && todayRecharge.id === id) {
        setTodayRecharge(null);
      }
      
      toast.success('Registro de recargas eliminado exitosamente');
    } catch (err) {
      toast.error('Error al eliminar registro de recargas');
      throw err;
    }
  }

  return {
    recharges,
    todayRecharge,
    loading,
    error,
    fetchRecharges,
    addRecharge,
    updateRecharge,
    deleteRecharge
  };
}