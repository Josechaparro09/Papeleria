// src/hooks/useRecharges.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CashRegister, RechargeTransaction } from '../types/database';
import toast from 'react-hot-toast';
import { getTodayISO } from '../utils/dateHelper';

export function useRecharges() {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [todayCashRegister, setTodayCashRegister] = useState<CashRegister | null>(null);
  const [transactions, setTransactions] = useState<RechargeTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashRegisters();
  }, []);

  async function fetchCashRegisters() {
    try {
      setLoading(true);
      const { data: cashData, error: cashError } = await supabase
        .from('cash_registers')
        .select('*')
        .order('date', { ascending: false });

      if (cashError) throw cashError;

      const today = getTodayISO();
      const todayRegister = cashData?.find(r => r.date === today) || null;
      setTodayCashRegister(todayRegister);
      setCashRegisters(cashData || []);

      if (todayRegister) {
        await fetchTransactions(todayRegister.id);
      }
    } catch (err) {
      toast.error('Error al cargar datos de caja');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransactions(cashRegisterId: string) {
    const { data, error } = await supabase
      .from('recharge_transactions')
      .select('*')
      .eq('cash_register_id', cashRegisterId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setTransactions(data || []);
  }

  async function openCashRegister(openingBalance: number) {
    try {
      const today = getTodayISO();
      const existingRegister = cashRegisters.find(r => r.date === today);

      if (existingRegister) {
        toast.error('Ya existe una caja abierta para hoy');
        return existingRegister;
      }

      const { data, error } = await supabase
        .from('cash_registers')
        .insert([{ date: today, opening_balance: openingBalance }])
        .select()
        .single();

      if (error) throw error;

      setCashRegisters([data, ...cashRegisters]);
      setTodayCashRegister(data);
      setTransactions([]);
      toast.success('Caja abierta exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al abrir la caja');
      throw err;
    }
  }

  async function closeCashRegister(cashRegisterId: string) {
    try {
      const totalRecharges = transactions.reduce((sum, t) => sum + t.amount, 0);
      const currentRegister = cashRegisters.find(r => r.id === cashRegisterId);
      if (!currentRegister) throw new Error('Caja no encontrada');

      const closingBalance = currentRegister.opening_balance - totalRecharges;

      const { data, error } = await supabase
        .from('cash_registers')
        .update({ closing_balance: closingBalance })
        .eq('id', cashRegisterId)
        .select()
        .single();

      if (error) throw error;

      setCashRegisters(cashRegisters.map(r => (r.id === cashRegisterId ? data : r)));
      if (todayCashRegister?.id === cashRegisterId) {
        setTodayCashRegister(data);
      }
      toast.success('Caja cerrada exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al cerrar la caja');
      throw err;
    }
  }

  async function addRechargeTransaction(cashRegisterId: string, description: string, amount: number) {
    try {
      const { data, error } = await supabase
        .from('recharge_transactions')
        .insert([{ cash_register_id: cashRegisterId, description, amount }])
        .select()
        .single();

      if (error) throw error;

      setTransactions([data, ...transactions]);
      toast.success('Recarga registrada exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al registrar la recarga');
      throw err;
    }
  }

  function getCurrentBalance(): number {
    if (!todayCashRegister) return 0;
    const totalRecharges = transactions.reduce((sum, t) => sum + t.amount, 0);
    return todayCashRegister.opening_balance - totalRecharges;
  }

  return {
    cashRegisters,
    todayCashRegister,
    transactions,
    loading,
    openCashRegister,
    closeCashRegister,
    addRechargeTransaction,
    fetchCashRegisters,
    fetchTransactions,
    getCurrentBalance,
  };
}