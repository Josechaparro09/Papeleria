// src/hooks/useSublimationSalesWithCash.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SublimationSale, SublimationService } from '../types/database';
import toast from 'react-hot-toast';
import { useCashRegister } from './useCashRegister';

export function useSublimationSalesWithCash() {
	const [sales, setSales] = useState<SublimationSale[]>([]);
	const [services, setServices] = useState<SublimationService[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { refreshStats } = useCashRegister();

	// Cargar ventas con detalles del servicio
	const fetchSales = async () => {
		try {
			setLoading(true);
			// Primero cargar las ventas
			const { data: salesData, error: salesError } = await supabase
				.from('sublimation_sales')
				.select('*')
				.order('date', { ascending: false });

			if (salesError) throw salesError;

			// Luego cargar los servicios
			const { data: servicesData, error: servicesError } = await supabase
				.from('sublimation_services')
				.select('*');

			if (servicesError) throw servicesError;

			// Combinar los datos manualmente
			const salesWithServices = (salesData || []).map(sale => ({
				...sale,
				service: (servicesData || []).find(service => service.id === sale.service_id)
			}));

			setSales(salesWithServices);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar ventas');
		} finally {
			setLoading(false);
		}
	}

	// Cargar servicios para usar en ventas
	const fetchServices = async () => {
		try {
			const { data, error } = await supabase
				.from('sublimation_services')
				.select('*')
				.order('name');

			if (error) throw error;
			setServices(data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar servicios');
		}
	}

	useEffect(() => {
		fetchSales();
		fetchServices();
	}, []);

	// Agregar nueva venta
	const addSale = async (saleData: Omit<SublimationSale, 'id' | 'created_at' | 'updated_at'>) => {
		try {
			// 1. Insertar en sublimation_sales
			const { data: sublimationSale, error: sublimationError } = await supabase
				.from('sublimation_sales')
				.insert([saleData])
				.select()
				.single();

			if (sublimationError) throw sublimationError;

			// 2. Insertar en sales principal para integración con caja
			const { error: salesError } = await supabase
				.from('sales')
				.insert([{
					date: saleData.date,
					total: saleData.total,
					type: 'sublimation',
					customer_name: saleData.customer_name || null,
					payment_method: saleData.payment_method || null
				}]);

			if (salesError) {
				console.error('Error inserting into sales table:', salesError);
				// No lanzamos error aquí para no afectar la venta principal
			}

			// Actualizar estadísticas de caja
			await refreshStats();

			setSales(prev => [sublimationSale, ...prev]);
			toast.success('Venta de sublimación registrada exitosamente');
			return sublimationSale;
		} catch (err) {
			toast.error('Error al registrar la venta');
			throw err;
		}
	}

	// Actualizar venta
	const updateSale = async (id: string, updates: Partial<Omit<SublimationSale, 'id' | 'created_at' | 'updated_at'>>) => {
		try {
			// 1. Actualizar en sublimation_sales
			const { data, error } = await supabase
				.from('sublimation_sales')
				.update(updates)
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;

			// 2. Actualizar en sales principal si hay cambios relevantes
			if (updates.total || updates.date || updates.customer_name || updates.payment_method) {
				const { error: salesError } = await supabase
					.from('sales')
					.update({
						date: updates.date || data.date,
						total: updates.total || data.total,
						customer_name: updates.customer_name !== undefined ? updates.customer_name : data.customer_name,
						payment_method: updates.payment_method || data.payment_method
					})
					.eq('type', 'sublimation')
					.eq('date', data.date)
					.eq('total', data.total);

				if (salesError) {
					console.error('Error updating sales table:', salesError);
				}
			}

			setSales(prev => prev.map(sale => sale.id === id ? data : sale));
			await refreshStats();
			toast.success('Venta actualizada exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al actualizar la venta');
			throw err;
		}
	}

	// Eliminar venta
	const deleteSale = async (id: string) => {
		try {
			// 1. Obtener datos de la venta antes de eliminar
			const saleToDelete = sales.find(sale => sale.id === id);
			
			// 2. Eliminar de sublimation_sales
			const { error } = await supabase
				.from('sublimation_sales')
				.delete()
				.eq('id', id);

			if (error) throw error;

			// 3. Eliminar de sales principal si existe
			if (saleToDelete) {
				const { error: salesError } = await supabase
					.from('sales')
					.delete()
					.eq('type', 'sublimation')
					.eq('date', saleToDelete.date)
					.eq('total', saleToDelete.total);

				if (salesError) {
					console.error('Error deleting from sales table:', salesError);
				}
			}

			setSales(prev => prev.filter(sale => sale.id !== id));
			await refreshStats();
			toast.success('Venta eliminada exitosamente');
		} catch (err) {
			toast.error('Error al eliminar la venta');
			throw err;
		}
	}

	// Actualizar estado de venta
	const updateSaleStatus = async (id: string, status: SublimationSale['status']) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_sales')
				.update({ status })
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;

			setSales(prev => prev.map(sale => sale.id === id ? data : sale));
			toast.success('Estado actualizado exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al actualizar el estado');
			throw err;
		}
	}

	// Búsqueda de ventas
	const searchSales = (query: string) => {
		return sales.filter(sale => 
			sale.id.toLowerCase().includes(query.toLowerCase()) ||
			sale.service?.name.toLowerCase().includes(query.toLowerCase()) ||
			sale.notes?.toLowerCase().includes(query.toLowerCase())
		);
	}

	// Filtrar por estado
	const filterByStatus = (status: SublimationSale['status']) => {
		return sales.filter(sale => sale.status === status);
	}

	// Filtrar por rango de fechas
	const filterByDateRange = (startDate: string, endDate: string) => {
		return sales.filter(sale => {
			const saleDate = new Date(sale.date);
			const start = new Date(startDate);
			const end = new Date(endDate);
			return saleDate >= start && saleDate <= end;
		});
	}

	// Obtener estadísticas
	const getStats = () => {
		const totalSales = sales.length;
		const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
		const pendingSales = sales.filter(s => s.status === 'pending').length;
		const completedSales = sales.filter(s => s.status === 'completed').length;
		const inProgressSales = sales.filter(s => s.status === 'in_progress').length;
		const cancelledSales = sales.filter(s => s.status === 'cancelled').length;

		return {
			totalSales,
			totalRevenue,
			pendingSales,
			completedSales,
			inProgressSales,
			cancelledSales,
			averageSale: totalSales > 0 ? totalRevenue / totalSales : 0
		};
	}

	return {
		sales,
		services,
		loading,
		error,
		addSale,
		updateSale,
		deleteSale,
		updateSaleStatus,
		searchSales,
		filterByStatus,
		filterByDateRange,
		getStats,
		refetch: fetchSales
	};
}
