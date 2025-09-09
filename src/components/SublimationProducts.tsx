"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
	Package,
	Plus,
	Pencil,
	Trash2,
	X,
	Search,
	ArrowUpDown,
	Tag,
	DollarSign,
	Layers,
	AlertTriangle,
	Image,
	Filter,
	Eye
} from "lucide-react"
import type { SublimationProduct } from "../types/database"
import formatMoney from "../utils/format"
import { useSublimationProducts } from "../hooks/useSublimationProducts"

const SUBLIMATION_CATEGORIES = [
	{ value: 'taza', label: 'Tazas', icon: '☕' },
	{ value: 'camiseta', label: 'Camisetas', icon: '👕' },
	{ value: 'gorra', label: 'Gorras', icon: '🧢' },
	{ value: 'mousepad', label: 'Mousepads', icon: '🖱️' },
	{ value: 'cojin', label: 'Cojines', icon: '🪑' },
	{ value: 'otro', label: 'Otros', icon: '📦' }
]

function SublimationProducts() {
	const {
		products,
		loading,
		error,
		addProduct: addProductToDB,
		updateProduct: updateProductInDB,
		deleteProduct: deleteProductFromDB,
		searchProducts,
		filterByCategory,
		getLowStockProducts
	} = useSublimationProducts()
	const [showAddModal, setShowAddModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [showImageModal, setShowImageModal] = useState(false)
	const [currentProduct, setCurrentProduct] = useState<SublimationProduct | null>(null)
	const [selectedImage, setSelectedImage] = useState<string>('')
	
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		category: "",
		base_price: "",
		stock: "",
		min_stock: "",
		image_url: ""
	})

	// Search and filter state
	const [searchTerm, setSearchTerm] = useState("")
	const [sortField, setSortField] = useState<keyof SublimationProduct>("name")
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
	const [categoryFilter, setCategoryFilter] = useState<string>("all")
	const [showLowStock, setShowLowStock] = useState(false)
	const [filteredProducts, setFilteredProducts] = useState<SublimationProduct[]>([])

	// Apply filters and search
	useEffect(() => {
		let result = [...(products || [])]

		// Apply search
		if (searchTerm) {
			const lowerSearchTerm = searchTerm.toLowerCase()
			result = result.filter(
				(product) =>
					product.name.toLowerCase().includes(lowerSearchTerm) ||
					(product.description && product.description.toLowerCase().includes(lowerSearchTerm))
			)
		}

		// Apply category filter
		if (categoryFilter !== "all") {
			result = result.filter((product) => product.category === categoryFilter)
		}

		// Apply low stock filter
		if (showLowStock) {
			result = result.filter((product) => product.stock <= product.min_stock)
		}

		// Apply sorting
		result.sort((a, b) => {
			const aValue = a[sortField]
			const bValue = b[sortField]

			if (typeof aValue === "string" && typeof bValue === "string") {
				return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
			}

			if (sortDirection === "asc") {
				return (aValue as number) - (bValue as number)
			} else {
				return (bValue as number) - (aValue as number)
			}
		})

		setFilteredProducts(result)
	}, [products, searchTerm, sortField, sortDirection, categoryFilter, showLowStock])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })
	}

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			category: "",
			base_price: "",
			stock: "",
			min_stock: "",
			image_url: ""
		})
	}

	const openAddModal = () => {
		resetForm()
		setShowAddModal(true)
	}

	const openEditModal = (product: SublimationProduct) => {
		setCurrentProduct(product)
		setFormData({
			name: product.name,
			description: product.description || "",
			category: product.category,
			base_price: product.base_price.toString(),
			stock: product.stock.toString(),
			min_stock: product.min_stock.toString(),
			image_url: product.image_url || ""
		})
		setShowEditModal(true)
	}

	const openImageModal = (imageUrl: string) => {
		setSelectedImage(imageUrl)
		setShowImageModal(true)
	}

	const handleAddProduct = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			await addProductToDB({
				name: formData.name,
				description: formData.description || undefined,
				category: formData.category as any,
				base_price: Number.parseFloat(formData.base_price),
				stock: Number.parseInt(formData.stock),
				min_stock: Number.parseInt(formData.min_stock),
				image_url: formData.image_url || undefined
			})
			setShowAddModal(false)
			resetForm()
		} catch (error) {
			console.error("Error adding product:", error)
		}
	}

	const handleUpdateProduct = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!currentProduct) return

		try {
			await updateProductInDB(currentProduct.id, {
				name: formData.name,
				description: formData.description || undefined,
				category: formData.category as any,
				base_price: Number.parseFloat(formData.base_price),
				stock: Number.parseInt(formData.stock),
				min_stock: Number.parseInt(formData.min_stock),
				image_url: formData.image_url || undefined
			})
			setShowEditModal(false)
			resetForm()
		} catch (error) {
			console.error("Error updating product:", error)
		}
	}

	const handleDeleteProduct = async (id: string) => {
		if (window.confirm("¿Estás seguro de eliminar este producto?")) {
			try {
				await deleteProductFromDB(id)
			} catch (error) {
				console.error("Error deleting product:", error)
			}
		}
	}

	const handleSort = (field: keyof SublimationProduct) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("asc")
		}
	}

	const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length
	const totalValue = filteredProducts.reduce((sum, product) => sum + (product.base_price * product.stock), 0)

	const getCategoryInfo = (category: string) => {
		return SUBLIMATION_CATEGORIES.find(cat => cat.value === category) || { value: category, label: category, icon: '📦' }
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center space-x-2">
					<div className="p-2 bg-blue-100 rounded-lg">
						<Package className="text-blue-600 h-6 w-6" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-gray-900">Productos Base</h2>
						<p className="text-sm text-gray-500">Gestiona productos base (en blanco) para servicios de sublimación</p>
					</div>
				</div>
				<button
					onClick={openAddModal}
					className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
				>
					<Plus size={20} />
					<span>Agregar producto base</span>
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
					<div>
						<p className="text-sm text-gray-500">Total productos base</p>
						<p className="text-2xl font-bold text-gray-900 mt-1">{filteredProducts.length}</p>
					</div>
						<div className="p-2 bg-blue-100 rounded-full">
							<Package className="h-5 w-5 text-blue-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Bajo stock</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{lowStockCount}</p>
						</div>
						<div className="p-2 bg-orange-100 rounded-full">
							<AlertTriangle className="h-5 w-5 text-orange-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Valor total</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalValue)}</p>
						</div>
						<div className="p-2 bg-green-100 rounded-full">
							<DollarSign className="h-5 w-5 text-green-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Categorías</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{SUBLIMATION_CATEGORIES.length}</p>
						</div>
						<div className="p-2 bg-purple-100 rounded-full">
							<Tag className="h-5 w-5 text-purple-600" />
						</div>
					</div>
				</div>
			</div>

			{/* Filters and Search */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="relative flex-1">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="text"
							placeholder="Buscar productos base..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div className="flex items-center space-x-2">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">Todas las categorías</option>
							{SUBLIMATION_CATEGORIES.map((category) => (
								<option key={category.value} value={category.value}>
									{category.icon} {category.label}
								</option>
							))}
						</select>
						<button
							onClick={() => setShowLowStock(!showLowStock)}
							className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
								showLowStock
									? "bg-orange-50 text-orange-700 border-orange-200"
									: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
							}`}
						>
							<AlertTriangle size={16} className={showLowStock ? "text-orange-500" : "text-gray-400"} />
							<span>Stock bajo ({lowStockCount})</span>
						</button>
					</div>
				</div>
			</div>

			{/* Products Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredProducts.map((product) => {
					const categoryInfo = getCategoryInfo(product.category)
					const isLowStock = product.stock <= product.min_stock

					return (
						<div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
							{/* Product Image */}
							<div className="relative h-48 bg-gray-100">
								{product.image_url ? (
									<img
										src={product.image_url}
										alt={product.name}
										className="w-full h-full object-cover cursor-pointer"
										onClick={() => openImageModal(product.image_url!)}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
										<div className="text-center">
											<Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
											<p className="text-sm text-gray-500">Sin imagen</p>
										</div>
									</div>
								)}
								{isLowStock && (
									<div className="absolute top-2 right-2">
										<span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
											Bajo stock
										</span>
									</div>
								)}
								<div className="absolute top-2 left-2">
									<span className="px-2 py-1 bg-white bg-opacity-90 text-gray-700 text-xs font-medium rounded-full">
										{categoryInfo.icon} {categoryInfo.label}
									</span>
								</div>
							</div>

							{/* Product Info */}
							<div className="p-4">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
								{product.description && (
									<p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
								)}

								{/* Pricing */}
								<div className="space-y-2 mb-4">
									<div className="flex justify-between text-sm font-semibold">
										<span className="text-gray-700">Costo del producto:</span>
										<span className="text-blue-600">{formatMoney(product.base_price)}</span>
									</div>
								</div>

								{/* Stock */}
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center space-x-2">
										<Layers className="h-4 w-4 text-gray-400" />
										<span className="text-sm text-gray-600">Stock: {product.stock}</span>
									</div>
									<div className="text-xs text-gray-500">
										Mín: {product.min_stock}
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<button
											onClick={() => openEditModal(product)}
											className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
											title="Editar producto"
										>
											<Pencil size={16} />
										</button>
										<button
											onClick={() => handleDeleteProduct(product.id)}
											className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="Eliminar producto"
										>
											<Trash2 size={16} />
										</button>
									</div>
									{product.image_url && (
										<button
											onClick={() => openImageModal(product.image_url!)}
											className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
											title="Ver imagen"
										>
											<Eye size={16} />
										</button>
									)}
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* Empty State */}
			{filteredProducts.length === 0 && (
				<div className="text-center py-12">
					<div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
						<Package className="h-8 w-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{searchTerm || categoryFilter !== "all" || showLowStock 
							? "No se encontraron productos base" 
							: "No hay productos base registrados"}
					</h3>
					<p className="text-gray-500 mb-4">
						{searchTerm || categoryFilter !== "all" || showLowStock
							? "Intenta con otros términos de búsqueda o elimina los filtros aplicados."
							: "Comienza agregando productos base (en blanco) para tus servicios de sublimación."}
					</p>
					{(searchTerm || categoryFilter !== "all" || showLowStock) ? (
						<button
							onClick={() => {
								setSearchTerm("")
								setCategoryFilter("all")
								setShowLowStock(false)
							}}
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
						>
							Limpiar filtros
						</button>
					) : (
						<button
							onClick={openAddModal}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							Agregar primer producto base
						</button>
					)}
				</div>
			)}

			{/* Add Product Modal */}
			{showAddModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
						<div className="absolute top-4 right-4">
							<button
								onClick={() => setShowAddModal(false)}
								className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
							>
								<X size={20} />
							</button>
						</div>
						<div className="mb-6">
							<div className="flex items-center space-x-3 mb-1">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Plus className="h-5 w-5 text-blue-600" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900">Agregar Producto Base</h3>
							</div>
							<p className="text-sm text-gray-500">Completa los detalles del producto base (en blanco) para sublimación</p>
						</div>
						<form onSubmit={handleAddProduct} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
								<input
									type="text"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
									placeholder="Ej: Taza Cerámica Blanca 11oz"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
									placeholder="Descripción del producto base (opcional)"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
								<select
									name="category"
									value={formData.category}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
								>
									<option value="">Seleccionar categoría</option>
									{SUBLIMATION_CATEGORIES.map((category) => (
										<option key={category.value} value={category.value}>
											{category.icon} {category.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Costo del Producto</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<DollarSign className="h-4 w-4 text-gray-400" />
									</div>
									<input
										type="number"
										name="base_price"
										value={formData.base_price}
										onChange={handleInputChange}
										required
										step="0.01"
										min="0"
										className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
										placeholder="0.00"
									/>
								</div>
								<p className="mt-1 text-xs text-gray-500">Costo de compra del producto en blanco</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Layers className="h-4 w-4 text-gray-400" />
										</div>
										<input
											type="number"
											name="stock"
											value={formData.stock}
											onChange={handleInputChange}
											required
											min="0"
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
											placeholder="0"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<AlertTriangle className="h-4 w-4 text-gray-400" />
										</div>
										<input
											type="number"
											name="min_stock"
											value={formData.min_stock}
											onChange={handleInputChange}
											required
											min="0"
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
											placeholder="0"
										/>
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen (opcional)</label>
								<input
									type="url"
									name="image_url"
									value={formData.image_url}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
									placeholder="https://ejemplo.com/imagen.jpg"
								/>
							</div>
							<div className="flex justify-end pt-2 space-x-3">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
								>
									Guardar producto base
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Product Modal */}
			{showEditModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
						<div className="absolute top-4 right-4">
							<button
								onClick={() => setShowEditModal(false)}
								className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
							>
								<X size={20} />
							</button>
						</div>
						<div className="mb-6">
							<div className="flex items-center space-x-3 mb-1">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Pencil className="h-5 w-5 text-blue-600" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900">Editar Producto Base</h3>
							</div>
							<p className="text-sm text-gray-500">Actualiza los detalles del producto base</p>
						</div>
						<form onSubmit={handleUpdateProduct} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
								<input
									type="text"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
								<select
									name="category"
									value={formData.category}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
								>
									{SUBLIMATION_CATEGORIES.map((category) => (
										<option key={category.value} value={category.value}>
											{category.icon} {category.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Costo del Producto</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<DollarSign className="h-4 w-4 text-gray-400" />
									</div>
									<input
										type="number"
										name="base_price"
										value={formData.base_price}
										onChange={handleInputChange}
										required
										step="0.01"
										min="0"
										className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
									/>
								</div>
								<p className="mt-1 text-xs text-gray-500">Costo de compra del producto en blanco</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Layers className="h-4 w-4 text-gray-400" />
										</div>
										<input
											type="number"
											name="stock"
											value={formData.stock}
											onChange={handleInputChange}
											required
											min="0"
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<AlertTriangle className="h-4 w-4 text-gray-400" />
										</div>
										<input
											type="number"
											name="min_stock"
											value={formData.min_stock}
											onChange={handleInputChange}
											required
											min="0"
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
										/>
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen (opcional)</label>
								<input
									type="url"
									name="image_url"
									value={formData.image_url}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
									placeholder="https://ejemplo.com/imagen.jpg"
								/>
							</div>
							<div className="flex justify-end pt-2 space-x-3">
								<button
									type="button"
									onClick={() => setShowEditModal(false)}
									className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
								>
									Actualizar producto base
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Image Modal */}
			{showImageModal && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
					<div className="relative max-w-4xl max-h-[90vh]">
						<button
							onClick={() => setShowImageModal(false)}
							className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
						>
							<X size={24} />
						</button>
						<img
							src={selectedImage}
							alt="Vista previa"
							className="max-w-full max-h-full rounded-lg"
						/>
					</div>
				</div>
			)}
		</div>
	)
}

export default SublimationProducts
