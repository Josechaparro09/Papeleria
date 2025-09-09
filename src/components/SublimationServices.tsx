"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
	Wrench,
	Plus,
	Pencil,
	Trash2,
	X,
	Search,
	ArrowUpDown,
	Tag,
	DollarSign,
	Package,
	Users,
	Settings,
	CheckCircle,
	AlertCircle
} from "lucide-react"
import type { SublimationService, SublimationServiceProduct, SublimationProduct } from "../types/database"
import formatMoney from "../utils/format"
import { useSublimationServices } from "../hooks/useSublimationServices"

function SublimationServices() {
	const {
		services,
		products,
		loading,
		error,
		addService: addServiceToDB,
		updateService: updateServiceInDB,
		deleteService: deleteServiceFromDB,
		addProductToService,
		updateServiceProduct,
		removeProductFromService,
		searchServices
	} = useSublimationServices()
	const [showAddModal, setShowAddModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [currentService, setCurrentService] = useState<SublimationService | null>(null)
	
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		base_price: "",
		products_used: [] as { product_id: string; quantity: number }[]
	})

	// Search and sort state
	const [searchTerm, setSearchTerm] = useState("")
	const [sortField, setSortField] = useState<keyof SublimationService>("name")
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
	const [filteredServices, setFilteredServices] = useState<SublimationService[]>([])

	// Apply filters and search
	useEffect(() => {
		let result = [...(services || [])]

		// Apply search
		if (searchTerm) {
			const lowerSearchTerm = searchTerm.toLowerCase()
			result = result.filter(
				(service) =>
					service.name.toLowerCase().includes(lowerSearchTerm) ||
					(service.description && service.description.toLowerCase().includes(lowerSearchTerm))
			)
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

		setFilteredServices(result)
	}, [services, searchTerm, sortField, sortDirection])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })
	}

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			base_price: "",
			products_used: []
		})
	}

	const openAddModal = () => {
		resetForm()
		setShowAddModal(true)
	}

	const openEditModal = (service: SublimationService) => {
		setCurrentService(service)
		setFormData({
			name: service.name,
			description: service.description || "",
			base_price: service.base_price.toString(),
			products_used: (service.products_used || []).map(p => ({ product_id: p.product_id, quantity: p.quantity }))
		})
		setShowEditModal(true)
	}

	const handleAddProductToService = () => {
		setFormData({
			...formData,
			products_used: [...formData.products_used, { product_id: '', quantity: 1 }]
		})
	}

	const handleRemoveProductFromService = (index: number) => {
		setFormData({
			...formData,
			products_used: formData.products_used.filter((_, i) => i !== index)
		})
	}

	const handleProductChange = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
		const updatedProducts = [...formData.products_used]
		updatedProducts[index] = { ...updatedProducts[index], [field]: value }
		setFormData({ ...formData, products_used: updatedProducts })
	}

	const handleAddService = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const newService = await addServiceToDB({
				name: formData.name,
				description: formData.description || undefined,
				base_price: Number.parseFloat(formData.base_price)
			})
			
			// Agregar productos al servicio después de crearlo
			for (const product of formData.products_used) {
				await addProductToService(newService.id, product.product_id, product.quantity)
			}
			
			setShowAddModal(false)
			resetForm()
		} catch (error) {
			console.error("Error adding service:", error)
		}
	}

	const handleUpdateService = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!currentService) return

		try {
			await updateServiceInDB(currentService.id, {
				name: formData.name,
				description: formData.description || undefined,
				base_price: Number.parseFloat(formData.base_price)
			})
			
			// Actualizar productos del servicio
			// Primero eliminar todos los productos existentes
			// Luego agregar los nuevos
			// Esto se manejará en el hook
			
			setShowEditModal(false)
			resetForm()
		} catch (error) {
			console.error("Error updating service:", error)
		}
	}

	const handleDeleteService = async (id: string) => {
		if (window.confirm("¿Estás seguro de eliminar este servicio?")) {
			try {
				await deleteServiceFromDB(id)
			} catch (error) {
				console.error("Error deleting service:", error)
			}
		}
	}

	const handleSort = (field: keyof SublimationService) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("asc")
		}
	}

	const calculateServiceTotal = (service: SublimationService) => {
		console.log('Service:', service.name, 'Products used:', service.products_used)
		const productsCost = (service.products_used || []).reduce((total, item) => {
			const product = products.find(p => p.id === item.product_id)
			console.log('Product found:', product?.name, 'for item:', item)
			if (product) {
				return total + (product.base_price * item.quantity)
			}
			return total
		}, 0)
		return service.base_price + productsCost
	}

	const totalServicesValue = (filteredServices || []).reduce((sum, service) => sum + calculateServiceTotal(service), 0)

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center space-x-2">
					<div className="p-2 bg-purple-100 rounded-lg">
						<Wrench className="text-purple-600 h-6 w-6" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-gray-900">Servicios de Sublimación</h2>
						<p className="text-sm text-gray-500">Configura servicios y productos utilizados</p>
					</div>
				</div>
				<button
					onClick={openAddModal}
					className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
				>
					<Plus size={20} />
					<span>Nuevo servicio</span>
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Total servicios</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{(filteredServices || []).length}</p>
						</div>
						<div className="p-2 bg-purple-100 rounded-full">
							<Wrench className="h-5 w-5 text-purple-600" />
						</div>
					</div>
					<p className="text-xs text-gray-500 mt-2">Servicios configurados</p>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Precio promedio</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">
								{(filteredServices || []).length > 0 ? formatMoney(totalServicesValue / (filteredServices || []).length) : "0.00"}
							</p>
						</div>
						<div className="p-2 bg-green-100 rounded-full">
							<DollarSign className="h-5 w-5 text-green-600" />
						</div>
					</div>
					<p className="text-xs text-gray-500 mt-2">Precio promedio de servicios</p>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Valor total</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalServicesValue)}</p>
						</div>
						<div className="p-2 bg-blue-100 rounded-full">
							<Tag className="h-5 w-5 text-blue-600" />
						</div>
					</div>
					<p className="text-xs text-gray-500 mt-2">Suma de todos los servicios</p>
				</div>
			</div>

			{/* Search */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
				<div className="relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Search className="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						placeholder="Buscar servicios..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* Services Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{(filteredServices || []).map((service) => {
					const serviceTotal = calculateServiceTotal(service)
					return (
						<div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
							{/* Service Header */}
							<div className="p-4 border-b border-gray-100">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
										{service.description && (
											<p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
										)}
									</div>
									<div className="flex items-center space-x-2 ml-4">
										<button
											onClick={() => openEditModal(service)}
											className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
											title="Editar servicio"
										>
											<Pencil size={16} />
										</button>
										<button
											onClick={() => handleDeleteService(service.id)}
											className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="Eliminar servicio"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							</div>

							{/* Service Details */}
							<div className="p-4">
								{/* Pricing */}
								<div className="space-y-2 mb-4">
									<div className="flex justify-between text-sm">
										<span className="text-gray-500">Precio base:</span>
										<span className="font-medium">{formatMoney(service.base_price)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-500">Productos:</span>
										<span className="font-medium">{formatMoney(serviceTotal - service.base_price)}</span>
									</div>
									<div className="flex justify-between text-sm font-semibold border-t pt-2">
										<span className="text-gray-700">Precio total:</span>
										<span className="text-purple-600">{formatMoney(serviceTotal)}</span>
									</div>
								</div>

								{/* Products Used */}
								<div className="space-y-2">
									<div className="flex items-center space-x-2 mb-2">
										<Package className="h-4 w-4 text-gray-400" />
										<span className="text-sm font-medium text-gray-700">Productos utilizados:</span>
									</div>
									{(service.products_used || []).length > 0 ? (
										<div className="space-y-1">
											{(service.products_used || []).map((item, index) => {
												const product = products.find(p => p.id === item.product_id)
												return (
													<div key={index} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
														<span className="text-gray-600 truncate flex-1">
															{product?.name || 'Producto no encontrado'}
														</span>
														<span className="text-gray-500 ml-2">
															x{item.quantity}
														</span>
													</div>
												)
											})}
										</div>
									) : (
										<p className="text-xs text-gray-500 italic">No hay productos configurados</p>
									)}
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* Empty State */}
			{(filteredServices || []).length === 0 && (
				<div className="text-center py-12">
					<div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
						<Wrench className="h-8 w-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{searchTerm ? "No se encontraron servicios" : "No hay servicios registrados"}
					</h3>
					<p className="text-gray-500 mb-4">
						{searchTerm ? "Intenta con otros términos de búsqueda." : "Comienza creando servicios de sublimación."}
					</p>
					{searchTerm ? (
						<button
							onClick={() => setSearchTerm("")}
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
						>
							Limpiar búsqueda
						</button>
					) : (
						<button
							onClick={openAddModal}
							className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
						>
							Crear primer servicio
						</button>
					)}
				</div>
			)}

			{/* Add Service Modal */}
			{showAddModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
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
								<div className="p-2 bg-purple-100 rounded-lg">
									<Plus className="h-5 w-5 text-purple-600" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900">Agregar Servicio</h3>
							</div>
							<p className="text-sm text-gray-500">Configura un nuevo servicio de sublimación</p>
						</div>
						<form onSubmit={handleAddService} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										required
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
										placeholder="Ej: Sublimación Taza Personalizada"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Precio Base</label>
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
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
											placeholder="0.00"
										/>
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
									placeholder="Descripción del servicio (opcional)"
								/>
							</div>

							{/* Products Used Section */}
							<div>
								<div className="flex items-center justify-between mb-3">
									<label className="block text-sm font-medium text-gray-700">Productos Utilizados</label>
									<button
										type="button"
										onClick={handleAddProductToService}
										className="flex items-center space-x-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
									>
										<Plus size={16} />
										<span>Agregar producto</span>
									</button>
								</div>
								<div className="space-y-3">
									{formData.products_used.map((item, index) => {
										const selectedProduct = products.find(p => p.id === item.product_id)
										return (
											<div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
												<div className="flex-1">
													<select
														value={item.product_id}
														onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
														required
													>
														<option value="">Seleccionar producto</option>
														{products.map((product) => (
															<option key={product.id} value={product.id}>
																{product.name} - {formatMoney(product.base_price)}
															</option>
														))}
													</select>
												</div>
												<div className="w-20">
													<input
														type="number"
														value={item.quantity}
														onChange={(e) => handleProductChange(index, 'quantity', Number.parseInt(e.target.value))}
														min="1"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
														placeholder="Cant."
													/>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveProductFromService(index)}
													className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
													title="Eliminar producto"
												>
													<X size={16} />
												</button>
											</div>
										)
									})}
									{formData.products_used.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											<Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
											<p className="text-sm">No hay productos seleccionados</p>
											<p className="text-xs">Haz clic en "Agregar producto" para comenzar</p>
										</div>
									)}
								</div>
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
									className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
								>
									Guardar servicio
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Service Modal */}
			{showEditModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
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
								<div className="p-2 bg-purple-100 rounded-lg">
									<Pencil className="h-5 w-5 text-purple-600" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900">Editar Servicio</h3>
							</div>
							<p className="text-sm text-gray-500">Actualiza la configuración del servicio</p>
						</div>
						<form onSubmit={handleUpdateService} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										required
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Precio Base</label>
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
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
										/>
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
								/>
							</div>

							{/* Products Used Section */}
							<div>
								<div className="flex items-center justify-between mb-3">
									<label className="block text-sm font-medium text-gray-700">Productos Utilizados</label>
									<button
										type="button"
										onClick={handleAddProductToService}
										className="flex items-center space-x-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
									>
										<Plus size={16} />
										<span>Agregar producto</span>
									</button>
								</div>
								<div className="space-y-3">
									{formData.products_used.map((item, index) => {
										const selectedProduct = products.find(p => p.id === item.product_id)
										return (
											<div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
												<div className="flex-1">
													<select
														value={item.product_id}
														onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
														required
													>
														<option value="">Seleccionar producto</option>
														{products.map((product) => (
															<option key={product.id} value={product.id}>
																{product.name} - {formatMoney(product.base_price)}
															</option>
														))}
													</select>
												</div>
												<div className="w-20">
													<input
														type="number"
														value={item.quantity}
														onChange={(e) => handleProductChange(index, 'quantity', Number.parseInt(e.target.value))}
														min="1"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
														placeholder="Cant."
													/>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveProductFromService(index)}
													className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
													title="Eliminar producto"
												>
													<X size={16} />
												</button>
											</div>
										)
									})}
									{formData.products_used.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											<Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
											<p className="text-sm">No hay productos seleccionados</p>
											<p className="text-xs">Haz clic en "Agregar producto" para comenzar</p>
										</div>
									)}
								</div>
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
									className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
								>
									Actualizar servicio
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}

export default SublimationServices
