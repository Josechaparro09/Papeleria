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
			const { data, error } = await supabase
				.from('sublimation_sales')
				.insert([saleData])
				.select()
				.single();

			if (error) throw error;

			// Actualizar estadísticas de caja
			await refreshStats();

			setSales(prev => [data, ...prev]);
			toast.success('Venta de sublimación registrada exitosamente');
			return data;
		} catch (err) {
			toast.error('Error al registrar la venta');
			throw err;
		}
	}

	// Actualizar venta
	const updateSale = async (id: string, updates: Partial<Omit<SublimationSale, 'id' | 'created_at' | 'updated_at'>>) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_sales')
				.update(updates)
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;

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
			const { error } = await supabase
				.from('sublimation_sales')
				.delete()
				.eq('id', id);

			if (error) throw error;

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
