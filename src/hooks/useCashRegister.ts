// src/hooks/useCashRegister.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CashRegister, RechargeTransaction } from '../types/database';
import toast from 'react-hot-toast';
import { getTodayISO } from '../utils/dateHelper';

export interface CashRegisterStats {
	totalSales: number;
	totalExpenses: number;
	totalRecharges: number;
	currentBalance: number;
	openingBalance: number;
	closingBalance?: number;
	generalSales?: number;
	sublimationSales?: number;
}

export function useCashRegister() {
	const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
	const [transactions, setTransactions] = useState<RechargeTransaction[]>([]);
	const [stats, setStats] = useState<CashRegisterStats>({
		totalSales: 0,
		totalExpenses: 0,
		totalRecharges: 0,
		currentBalance: 0,
		openingBalance: 0
	});
	const [loading, setLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		checkCashRegisterStatus();
	}, []);

	async function checkCashRegisterStatus() {
		try {
			setLoading(true);
			const today = getTodayISO();
			
			// Verificar si existe caja para hoy
			const { data: cashData, error: cashError } = await supabase
				.from('cash_registers')
				.select('*')
				.eq('date', today)
				.single();

			if (cashError && cashError.code !== 'PGRST116') {
				throw cashError;
			}

			if (cashData) {
				setCashRegister(cashData);
				setIsOpen(true);
				await loadTransactions(cashData.id);
				await calculateStats(cashData.id);
			} else {
				setIsOpen(false);
			}
		} catch (err) {
			toast.error('Error al verificar estado de caja');
			console.error('Error checking cash register:', err);
		} finally {
			setLoading(false);
		}
	}

	async function loadTransactions(cashRegisterId: string) {
		try {
			const { data, error } = await supabase
				.from('recharge_transactions')
				.select('*')
				.eq('cash_register_id', cashRegisterId)
				.order('created_at', { ascending: false });

			if (error) throw error;
			setTransactions(data || []);
		} catch (err) {
			console.error('Error loading transactions:', err);
		}
	}

	async function calculateStats(cashRegisterId: string) {
		try {
			const today = getTodayISO();
			
			// Obtener ventas del día (generales + sublimación)
			const { data: salesData, error: salesError } = await supabase
				.from('sales')
				.select('total, type')
				.gte('date', today)
				.lt('date', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

			// Obtener gastos del día
			const { data: expensesData, error: expensesError } = await supabase
				.from('expenses')
				.select('amount')
				.eq('date', today);

			// Obtener recargas del día
			const { data: rechargesData, error: rechargesError } = await supabase
				.from('recharge_transactions')
				.select('amount')
				.eq('cash_register_id', cashRegisterId);

			if (salesError) throw salesError;
			if (expensesError) throw expensesError;
			if (rechargesError) throw rechargesError;

			const totalSales = (salesData || []).reduce((sum, sale) => sum + Number(sale.total), 0);
			const totalExpenses = (expensesData || []).reduce((sum, expense) => sum + Number(expense.amount), 0);
			const totalRecharges = (rechargesData || []).reduce((sum, recharge) => sum + Number(recharge.amount), 0);

			// Separar ventas por tipo para estadísticas detalladas
			const generalSales = (salesData || []).filter(sale => sale.type !== 'sublimation');
			const sublimationSales = (salesData || []).filter(sale => sale.type === 'sublimation');

			setStats(prev => ({
				...prev,
				totalSales,
				totalExpenses,
				totalRecharges,
				currentBalance: prev.openingBalance + totalSales - totalExpenses - totalRecharges,
				generalSales: generalSales.reduce((sum, sale) => sum + Number(sale.total), 0),
				sublimationSales: sublimationSales.reduce((sum, sale) => sum + Number(sale.total), 0)
			}));
		} catch (err) {
			console.error('Error calculating stats:', err);
		}
	}

	async function openCashRegister(openingBalance: number) {
		try {
			const today = getTodayISO();
			
			const { data, error } = await supabase
				.from('cash_registers')
				.insert([{
					date: today,
					opening_balance: openingBalance,
					closing_balance: null
				}])
				.select()
				.single();

			if (error) throw error;

			setCashRegister(data);
			setIsOpen(true);
			setStats(prev => ({
				...prev,
				openingBalance,
				currentBalance: openingBalance
			}));
			
			toast.success('Caja abierta exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al abrir caja');
			throw err;
		}
	}

	async function closeCashRegister(closingBalance: number) {
		try {
			if (!cashRegister) throw new Error('No hay caja abierta');

			const { data, error } = await supabase
				.from('cash_registers')
				.update({ closing_balance: closingBalance })
				.eq('id', cashRegister.id)
				.select()
				.single();

			if (error) throw error;

			setCashRegister(data);
			setIsOpen(false);
			setStats(prev => ({
				...prev,
				closingBalance
			}));
			
			toast.success('Caja cerrada exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al cerrar caja');
			throw err;
		}
	}

	async function addRechargeTransaction(description: string, amount: number) {
		try {
			if (!cashRegister) throw new Error('No hay caja abierta');

			const { data, error } = await supabase
				.from('recharge_transactions')
				.insert([{
					cash_register_id: cashRegister.id,
					description,
					amount
				}])
				.select()
				.single();

			if (error) throw error;

			setTransactions(prev => [data, ...prev]);
			setStats(prev => ({
				...prev,
				totalRecharges: prev.totalRecharges + amount,
				currentBalance: prev.currentBalance - amount
			}));
			
			toast.success('Recarga registrada exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al registrar recarga');
			throw err;
		}
	}

	async function refreshStats() {
		if (cashRegister) {
			await calculateStats(cashRegister.id);
		}
	}

	return {
		cashRegister,
		transactions,
		stats,
		loading,
		isOpen,
		openCashRegister,
		closeCashRegister,
		addRechargeTransaction,
		refreshStats,
		checkCashRegisterStatus
	};
}
