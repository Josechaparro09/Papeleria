// src/hooks/useRecharges.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Recharge } from '../types/database';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getTodayISO } from '../utils/dateHelper';

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
      const today = getTodayISO();
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
      
      // Verificar si ya existe una recarga para la fecha especificada
      const existingRecharge = recharges.find(r => r.date === recharge.date);
      
      if (existingRecharge) {
        // Si existe, actualizar en lugar de crear
        return updateRecharge(existingRecharge.id, {
          ...recharge,
          sales_amount: salesAmount
        });
      } else {
        // Si no existe, crear nueva
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
        
        // Actualizar todayRecharge si corresponde a la fecha actual
        const today = getTodayISO();
        if (data.date === today) {
          setTodayRecharge(data);
        }
        
        toast.success('Registro de recargas añadido exitosamente');
        return data;
      }
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
      const today = format(new Date(), 'yyyy-MM-dd');
      if (data.date === today) {
        setTodayRecharge(data);
      } else if (todayRecharge && todayRecharge.id === id) {
        // Si se cambió la fecha y ya no es hoy
        setTodayRecharge(null);
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

  // Función para verificar si existe una recarga en una fecha específica
  function getRechargeByDate(date: string): Recharge | null {
    return recharges.find(r => r.date === date) || null;
  }

  return {
    recharges,
    todayRecharge,
    loading,
    error,
    fetchRecharges,
    addRecharge,
    updateRecharge,
    deleteRecharge,
    getRechargeByDate
  };
}