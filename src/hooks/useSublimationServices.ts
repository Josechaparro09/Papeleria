import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { SublimationService, SublimationServiceProduct, SublimationProduct, SublimationServiceWithProducts } from '../types/database'

export function useSublimationServices() {
	const [services, setServices] = useState<SublimationService[]>([])
	const [products, setProducts] = useState<SublimationProduct[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Cargar servicios con productos utilizados
	const fetchServices = async () => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_services')
				.select(`
					*,
					sublimation_service_products (
						id,
						quantity,
						product_id,
						sublimation_products (
							id,
							name,
							category,
							base_price
						)
					)
				`)
				.order('created_at', { ascending: false })

			if (error) throw error
			
			// Mapear los datos para que coincidan con el tipo SublimationService
			const mappedServices: SublimationService[] = (data || []).map((service: SublimationServiceWithProducts) => ({
				...service,
				products_used: service.sublimation_service_products || []
			}))
			
			setServices(mappedServices)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar servicios')
		} finally {
			setLoading(false)
		}
	}

	// Cargar productos para usar en servicios
	const fetchProducts = async () => {
		try {
			const { data, error } = await supabase
				.from('sublimation_products')
				.select('*')
				.order('name')

			if (error) throw error
			setProducts(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar productos')
		}
	}

	// Agregar servicio
	const addService = async (service: Omit<SublimationService, 'id' | 'created_at' | 'updated_at' | 'products_used'>) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_services')
				.insert([service])
				.select()
				.single()

			if (error) throw error
			setServices(prev => [data, ...prev])
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al agregar servicio')
			throw err
		}
	}

	// Actualizar servicio
	const updateService = async (id: string, updates: Partial<SublimationService>) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_services')
				.update(updates)
				.eq('id', id)
				.select()
				.single()

			if (error) throw error
			setServices(prev => prev.map(s => s.id === id ? data : s))
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al actualizar servicio')
			throw err
		}
	}

	// Eliminar servicio
	const deleteService = async (id: string) => {
		try {
			const { error } = await supabase
				.from('sublimation_services')
				.delete()
				.eq('id', id)

			if (error) throw error
			setServices(prev => prev.filter(s => s.id !== id))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al eliminar servicio')
			throw err
		}
	}

	// Agregar producto a servicio
	const addProductToService = async (serviceId: string, productId: string, quantity: number) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_service_products')
				.insert([{
					service_id: serviceId,
					product_id: productId,
					quantity
				}])
				.select()
				.single()

			if (error) throw error
			
			// Recargar servicios para obtener los productos actualizados
			await fetchServices()
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al agregar producto al servicio')
			throw err
		}
	}

	// Actualizar cantidad de producto en servicio
	const updateServiceProduct = async (id: string, quantity: number) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_service_products')
				.update({ quantity })
				.eq('id', id)
				.select()
				.single()

			if (error) throw error
			
			// Recargar servicios para obtener los productos actualizados
			await fetchServices()
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al actualizar producto del servicio')
			throw err
		}
	}

	// Eliminar producto de servicio
	const removeProductFromService = async (id: string) => {
		try {
			const { error } = await supabase
				.from('sublimation_service_products')
				.delete()
				.eq('id', id)

			if (error) throw error
			
			// Recargar servicios para obtener los productos actualizados
			await fetchServices()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al eliminar producto del servicio')
			throw err
		}
	}

	// Buscar servicios
	const searchServices = async (query: string) => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_services')
				.select(`
					*,
					sublimation_service_products (
						id,
						quantity,
						product_id,
						sublimation_products (
							id,
							name,
							category,
							base_price
						)
					)
				`)
				.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
				.order('created_at', { ascending: false })

			if (error) throw error
			setServices(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al buscar servicios')
		} finally {
			setLoading(false)
		}
	}

	// Cargar datos al montar el componente
	useEffect(() => {
		fetchServices()
		fetchProducts()
	}, [])

	return {
		services,
		products,
		loading,
		error,
		fetchServices,
		fetchProducts,
		addService,
		updateService,
		deleteService,
		addProductToService,
		updateServiceProduct,
		removeProductFromService,
		searchServices
	}
}
