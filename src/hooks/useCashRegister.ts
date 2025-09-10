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
	productSales?: number;
	serviceSales?: number;
	cashSales?: number;
	// Nuevos campos para recargas por método de pago
	cashRecharges?: number;
	transferRecharges?: number;
	otherRecharges?: number;
}

export function useCashRegister() {
	const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
	const [transactions, setTransactions] = useState<RechargeTransaction[]>([]);
	const [stats, setStats] = useState<CashRegisterStats>({
		totalSales: 0,
		totalExpenses: 0,
		totalRecharges: 0,
		currentBalance: 0,
		openingBalance: 0,
		generalSales: 0,
		sublimationSales: 0,
		productSales: 0,
		serviceSales: 0,
		cashSales: 0,
		cashRecharges: 0,
		transferRecharges: 0,
		otherRecharges: 0
	});
	const [loading, setLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	useEffect(() => {
		checkCashRegisterStatus();
	}, []);

	// Efecto para refrescar estadísticas cuando se dispara el trigger
	useEffect(() => {
		if (refreshTrigger > 0 && cashRegister) {
			console.log('Trigger de actualización activado:', refreshTrigger);
			calculateStats(cashRegister.id);
		}
	}, [refreshTrigger, cashRegister]);

	async function checkCashRegisterStatus() {
		try {
			setLoading(true);
			const today = getTodayISO();
			
			// Buscar la caja abierta más reciente de hoy (sin closing_balance)
			const { data: cashData, error: cashError } = await supabase
				.from('cash_registers')
				.select('*')
				.eq('date', today)
				.is('closing_balance', null)
				.order('created_at', { ascending: false })
				.limit(1)
				.single();

			if (cashError && cashError.code !== 'PGRST116') {
				throw cashError;
			}

			if (cashData) {
				console.log('Caja encontrada:', cashData);
				setCashRegister(cashData);
				setIsOpen(true);
				await loadTransactions(cashData.id);
				await calculateStats(cashData.id);
			} else {
				console.log('No hay caja abierta para hoy');
				setIsOpen(false);
				// Resetear estado cuando no hay caja abierta
				setStats({
					totalSales: 0,
					totalExpenses: 0,
					totalRecharges: 0,
					currentBalance: 0,
					openingBalance: 0,
					closingBalance: undefined,
					generalSales: 0,
					sublimationSales: 0,
					productSales: 0,
					serviceSales: 0,
					cashSales: 0,
					cashRecharges: 0,
					transferRecharges: 0,
					otherRecharges: 0
				});
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
			console.log('Calculando estadísticas para caja:', cashRegisterId);
			
			// Obtener la caja actual para saber cuándo se abrió
			const { data: currentCashRegister, error: cashError } = await supabase
				.from('cash_registers')
				.select('created_at, opening_balance')
				.eq('id', cashRegisterId)
				.single();

			if (cashError) throw cashError;

			// Primero probar con consultas simples para debuggear
			console.log('Consultando ventas desde:', currentCashRegister.created_at);
			
			// Consulta de ventas relacionadas con esta caja específica
			const { data: salesData, error: salesError } = await supabase
				.from('sales')
				.select(`
					total, 
					payment_method,
					created_at,
					items:sale_items(
						item_type,
						quantity,
						unit_price,
						product_id,
						service_id,
						sublimation_service_id
					)
				`)
				.eq('cash_register_id', cashRegisterId);

			console.log('Ventas encontradas:', { salesData, salesError });

			// Consulta simple de gastos
			const { data: expensesData, error: expensesError } = await supabase
				.from('expenses')
				.select('amount, created_at')
				.gte('created_at', currentCashRegister.created_at);

			console.log('Gastos encontrados:', { expensesData, expensesError });

			// Consulta simple de recargas
			const { data: rechargesData, error: rechargesError } = await supabase
				.from('recharge_transactions')
				.select('amount, payment_method')
				.eq('cash_register_id', cashRegisterId);

			console.log('Recargas encontradas:', { rechargesData, rechargesError });


			if (salesError) throw salesError;
			if (expensesError) throw expensesError;
			if (rechargesError) throw rechargesError;

			// Calcular totales
			const totalSales = (salesData || []).reduce((sum, sale) => sum + Number(sale.total), 0);
			const totalExpenses = (expensesData || []).reduce((sum, expense) => sum + Number(expense.amount), 0);
			const totalRecharges = (rechargesData || []).reduce((sum, recharge) => sum + Number(recharge.amount), 0);

			// Separar recargas por método de pago
			let cashRecharges = 0;
			let transferRecharges = 0;
			let otherRecharges = 0;

			(rechargesData || []).forEach(recharge => {
				if (recharge.payment_method === 'Efectivo') {
					cashRecharges += Number(recharge.amount);
				} else if (recharge.payment_method === 'Transferencia') {
					transferRecharges += Number(recharge.amount);
				} else {
					otherRecharges += Number(recharge.amount);
				}
			});

			// Separar ventas por método de pago y categoría
			let cashSales = 0;
			let productSales = 0;
			let serviceSales = 0;
			let sublimationSales = 0;

			(salesData || []).forEach((sale, index) => {
				console.log(`Procesando venta ${index + 1}:`, {
					total: sale.total,
					payment_method: sale.payment_method,
					items: sale.items,
					itemsLength: sale.items?.length || 0
				});

				// Contar ventas en efectivo para el balance
				if (sale.payment_method === 'Efectivo') {
					cashSales += Number(sale.total);
				}

				// Categorizar por tipo de items
				if (sale.items && sale.items.length > 0) {
					sale.items.forEach((item: any, itemIndex: number) => {
						const itemTotal = item.quantity * item.unit_price;
						
						console.log(`  Item ${itemIndex + 1}:`, {
							item_type: item.item_type,
							quantity: item.quantity,
							unit_price: item.unit_price,
							itemTotal
						});
						
						if (item.item_type === 'product') {
							productSales += itemTotal;
							console.log(`    → Categorizado como PRODUCTO: +${itemTotal}`);
						} else if (item.item_type === 'service') {
							serviceSales += itemTotal;
							console.log(`    → Categorizado como SERVICIO: +${itemTotal}`);
						} else if (item.item_type === 'sublimation') {
							sublimationSales += itemTotal;
							console.log(`    → Categorizado como SUBLIMACIÓN: +${itemTotal}`);
						}
					});
				} else {
					// Si no hay items, considerar como producto por defecto
					productSales += Number(sale.total);
					console.log(`  → Sin items, categorizado como PRODUCTO por defecto: +${sale.total}`);
				}
			});

			console.log('Datos calculados:', {
				salesData: salesData || [],
				expensesData: expensesData || [],
				rechargesData: rechargesData || [],
				totalSales,
				totalExpenses,
				totalRecharges,
				productSales,
				serviceSales,
				sublimationSales,
				cashSales,
				cashRecharges,
				transferRecharges,
				otherRecharges
			});

			// Usar el saldo de apertura de la caja actual
			const currentOpeningBalance = currentCashRegister.opening_balance;
			// Las recargas en efectivo SUMAN al balance, las otras no afectan el balance físico
			const calculatedBalance = currentOpeningBalance + cashSales + cashRecharges - totalExpenses;
			
			console.log('Estadísticas calculadas:', {
				cashRegisterId,
				currentOpeningBalance,
				cashSales,
				cashRecharges,
				transferRecharges,
				otherRecharges,
				totalExpenses,
				totalRecharges,
				calculatedBalance,
				totalSales,
				salesCount: salesData?.length || 0
			});
			
			setStats(prev => ({
				...prev,
				totalSales,
				totalExpenses,
				totalRecharges,
				currentBalance: calculatedBalance,
				openingBalance: currentOpeningBalance,
				generalSales: productSales + serviceSales,
				sublimationSales,
				productSales,
				serviceSales,
				cashSales,
				cashRecharges,
				transferRecharges,
				otherRecharges
			}));
		} catch (err) {
			console.error('Error calculating stats:', err);
		}
	}

	async function openCashRegister(openingBalance: number) {
		try {
			const today = getTodayISO();
			
			// Cerrar todas las cajas abiertas anteriores del día
			await supabase
				.from('cash_registers')
				.update({ closing_balance: 0 })
				.eq('date', today)
				.is('closing_balance', null);

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

			console.log('Nueva caja creada:', data);
			setCashRegister(data);
			setIsOpen(true);
			setStats({
				totalSales: 0,
				totalExpenses: 0,
				totalRecharges: 0,
				currentBalance: openingBalance,
				openingBalance,
				closingBalance: undefined,
				generalSales: 0,
				sublimationSales: 0,
				productSales: 0,
				serviceSales: 0,
				cashSales: 0,
				cashRecharges: 0,
				transferRecharges: 0,
				otherRecharges: 0
			});
			
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
				closingBalance,
				currentBalance: closingBalance
			}));
			
			toast.success('Caja cerrada exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al cerrar caja');
			throw err;
		}
	}

	async function addRechargeTransaction(description: string, amount: number, paymentMethod: string = 'Efectivo') {
		try {
			if (!cashRegister) throw new Error('No hay caja abierta');

			console.log('Agregando recarga:', { description, amount, paymentMethod });

			const { data, error } = await supabase
				.from('recharge_transactions')
				.insert([{
					cash_register_id: cashRegister.id,
					description,
					amount,
					payment_method: paymentMethod
				}])
				.select()
				.single();

			if (error) throw error;

			setTransactions(prev => [data, ...prev]);
			
			// Solo afectar el balance si es efectivo
			if (paymentMethod === 'Efectivo') {
				setStats(prev => ({
					...prev,
					totalRecharges: prev.totalRecharges + amount,
					currentBalance: prev.currentBalance + amount // Las recargas en efectivo SUMAN al balance
				}));
			} else {
				// Para otros métodos de pago, solo actualizar el total de recargas
				setStats(prev => ({
					...prev,
					totalRecharges: prev.totalRecharges + amount
				}));
			}
			
			toast.success('Recarga registrada exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al registrar recarga');
			throw err;
		}
	}

	async function refreshStats() {
		if (cashRegister) {
			console.log('Refrescando estadísticas de caja:', cashRegister.id);
			try {
				await calculateStats(cashRegister.id);
				console.log('Estadísticas actualizadas exitosamente');
			} catch (error) {
				console.error('Error al actualizar estadísticas:', error);
			}
		} else {
			console.log('No hay caja abierta para refrescar estadísticas');
		}
	}

	// Función para forzar actualización inmediata
	function forceRefresh() {
		console.log('Forzando actualización inmediata de caja...');
		if (cashRegister) {
			// Actualizar inmediatamente sin esperar el trigger
			calculateStats(cashRegister.id);
		}
		setRefreshTrigger(prev => prev + 1);
	}

	async function getTodayCashRegisters() {
		try {
			const today = getTodayISO();
			const { data, error } = await supabase
				.from('cash_registers')
				.select('*')
				.eq('date', today)
				.order('created_at', { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (err) {
			console.error('Error getting today cash registers:', err);
			return [];
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
		forceRefresh,
		checkCashRegisterStatus,
		getTodayCashRegisters
	};
}
