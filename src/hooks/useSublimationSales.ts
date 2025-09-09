import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { SublimationSale, SublimationService } from '../types/database'

export function useSublimationSales() {
	const [sales, setSales] = useState<SublimationSale[]>([])
	const [services, setServices] = useState<SublimationService[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Cargar ventas con detalles del servicio
	const fetchSales = async () => {
		try {
			setLoading(true)
			// Primero cargar las ventas
			const { data: salesData, error: salesError } = await supabase
				.from('sublimation_sales')
				.select('*')
				.order('date', { ascending: false })

			if (salesError) throw salesError

			// Luego cargar los servicios
			const { data: servicesData, error: servicesError } = await supabase
				.from('sublimation_services')
				.select('*')

			if (servicesError) throw servicesError

			// Combinar los datos manualmente
			const salesWithServices = (salesData || []).map(sale => ({
				...sale,
				service: (servicesData || []).find(service => service.id === sale.service_id)
			}))

			console.log('Sales data from Supabase:', salesWithServices)
			setSales(salesWithServices)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar ventas')
		} finally {
			setLoading(false)
		}
	}

	// Cargar servicios para usar en ventas
	const fetchServices = async () => {
		try {
			const { data, error } = await supabase
				.from('sublimation_services')
				.select('*')
				.order('name')

			if (error) throw error
			console.log('Services data from Supabase:', data)
			setServices(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar servicios')
		}
	}

	// Agregar venta
	const addSale = async (sale: Omit<SublimationSale, 'id' | 'created_at' | 'updated_at' | 'service'>) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_sales')
				.insert([sale])
				.select(`
					*,
					sublimation_services (
						id,
						name,
						description,
						base_price,
						sublimation_cost
					)
				`)
				.single()

			if (error) throw error
			setSales(prev => [data, ...prev])
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al agregar venta')
			throw err
		}
	}

	// Actualizar venta
	const updateSale = async (id: string, updates: Partial<SublimationSale>) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_sales')
				.update(updates)
				.eq('id', id)
				.select(`
					*,
					sublimation_services (
						id,
						name,
						description,
						base_price,
						sublimation_cost
					)
				`)
				.single()

			if (error) throw error
			setSales(prev => prev.map(s => s.id === id ? data : s))
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al actualizar venta')
			throw err
		}
	}

	// Eliminar venta
	const deleteSale = async (id: string) => {
		try {
			const { error } = await supabase
				.from('sublimation_sales')
				.delete()
				.eq('id', id)

			if (error) throw error
			setSales(prev => prev.filter(s => s.id !== id))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al eliminar venta')
			throw err
		}
	}

	// Actualizar estado de venta
	const updateSaleStatus = async (id: string, status: SublimationSale['status']) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_sales')
				.update({ status })
				.eq('id', id)
				.select(`
					*,
					sublimation_services (
						id,
						name,
						description,
						base_price,
						sublimation_cost
					)
				`)
				.single()

			if (error) throw error
			setSales(prev => prev.map(s => s.id === id ? data : s))
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al actualizar estado de venta')
			throw err
		}
	}

	// Buscar ventas
	const searchSales = async (query: string) => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_sales')
				.select(`
					*,
					sublimation_services (
						id,
						name,
						description,
						base_price,
						sublimation_cost
					)
				`)
				.or(`notes.ilike.%${query}%,sublimation_services.name.ilike.%${query}%`)
				.order('date', { ascending: false })

			if (error) throw error
			setSales(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al buscar ventas')
		} finally {
			setLoading(false)
		}
	}

	// Filtrar por estado
	const filterByStatus = async (status: string) => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_sales')
				.select(`
					*,
					sublimation_services (
						id,
						name,
						description,
						base_price,
						sublimation_cost
					)
				`)
				.eq('status', status)
				.order('date', { ascending: false })

			if (error) throw error
			setSales(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al filtrar ventas')
		} finally {
			setLoading(false)
		}
	}

	// Filtrar por rango de fechas
	const filterByDateRange = async (startDate: string, endDate: string) => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_sales')
				.select(`
					*,
					sublimation_services (
						id,
						name,
						description,
						base_price,
						sublimation_cost
					)
				`)
				.gte('date', startDate)
				.lte('date', endDate)
				.order('date', { ascending: false })

			if (error) throw error
			setSales(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al filtrar ventas por fecha')
		} finally {
			setLoading(false)
		}
	}

	// Obtener estadísticas
	const getStats = async () => {
		try {
			const { data, error } = await supabase
				.from('sublimation_sales_stats')
				.select('*')
				.limit(1)

			if (error) throw error
			return data?.[0] || null
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al obtener estadísticas')
			return null
		}
	}

	// Cargar datos al montar el componente
	useEffect(() => {
		fetchSales()
		fetchServices()
	}, [])

	return {
		sales,
		services,
		loading,
		error,
		fetchSales,
		fetchServices,
		addSale,
		updateSale,
		deleteSale,
		updateSaleStatus,
		searchSales,
		filterByStatus,
		filterByDateRange,
		getStats
	}
}
