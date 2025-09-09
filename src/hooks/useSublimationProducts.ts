import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { SublimationProduct } from '../types/database'

export function useSublimationProducts() {
	const [products, setProducts] = useState<SublimationProduct[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Cargar productos
	const fetchProducts = async () => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_products')
				.select('*')
				.order('created_at', { ascending: false })

			if (error) throw error
			setProducts(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar productos')
		} finally {
			setLoading(false)
		}
	}

	// Agregar producto
	const addProduct = async (product: Omit<SublimationProduct, 'id' | 'created_at' | 'updated_at'>) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_products')
				.insert([product])
				.select()
				.single()

			if (error) throw error
			setProducts(prev => [data, ...prev])
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al agregar producto')
			throw err
		}
	}

	// Actualizar producto
	const updateProduct = async (id: string, updates: Partial<SublimationProduct>) => {
		try {
			const { data, error } = await supabase
				.from('sublimation_products')
				.update(updates)
				.eq('id', id)
				.select()
				.single()

			if (error) throw error
			setProducts(prev => prev.map(p => p.id === id ? data : p))
			return data
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al actualizar producto')
			throw err
		}
	}

	// Eliminar producto
	const deleteProduct = async (id: string) => {
		try {
			const { error } = await supabase
				.from('sublimation_products')
				.delete()
				.eq('id', id)

			if (error) throw error
			setProducts(prev => prev.filter(p => p.id !== id))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al eliminar producto')
			throw err
		}
	}

	// Buscar productos
	const searchProducts = async (query: string) => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_products')
				.select('*')
				.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
				.order('created_at', { ascending: false })

			if (error) throw error
			setProducts(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al buscar productos')
		} finally {
			setLoading(false)
		}
	}

	// Filtrar por categoría
	const filterByCategory = async (category: string) => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_products')
				.select('*')
				.eq('category', category)
				.order('created_at', { ascending: false })

			if (error) throw error
			setProducts(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al filtrar productos')
		} finally {
			setLoading(false)
		}
	}

	// Obtener productos con stock bajo
	const getLowStockProducts = async () => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('sublimation_products')
				.select('*')
				.lte('stock', supabase.raw('min_stock'))
				.order('stock', { ascending: true })

			if (error) throw error
			setProducts(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al obtener productos con stock bajo')
		} finally {
			setLoading(false)
		}
	}

	// Cargar productos al montar el componente
	useEffect(() => {
		fetchProducts()
	}, [])

	return {
		products,
		loading,
		error,
		fetchProducts,
		addProduct,
		updateProduct,
		deleteProduct,
		searchProducts,
		filterByCategory,
		getLowStockProducts
	}
}
