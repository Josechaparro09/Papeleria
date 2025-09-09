"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
	ShoppingCart,
	Plus,
	Pencil,
	Trash2,
	X,
	Search,
	ArrowUpDown,
	DollarSign,
	Clock,
	CheckCircle,
	AlertCircle,
	Eye
} from "lucide-react"
import type { SublimationSale } from "../types/database"
import formatMoney from "../utils/format"
import { useSublimationSalesWithCash } from "../hooks/useSublimationSalesWithCash"

function SublimationSales() {
	const {
		sales,
		services,
		loading,
		error,
		addSale: addSaleToDB,
		deleteSale: deleteSaleFromDB
	} = useSublimationSalesWithCash()

	// Debug logs
	console.log('SublimationSales - Sales:', sales)
	console.log('SublimationSales - Services:', services)
	console.log('SublimationSales - Loading:', loading)
	console.log('SublimationSales - Error:', error)
	const [showAddModal, setShowAddModal] = useState(false)
	// const [showEditModal, setShowEditModal] = useState(false)
	const [showDetailsModal, setShowDetailsModal] = useState(false)
	const [currentSale, setCurrentSale] = useState<SublimationSale | null>(null)
	
	const [formData, setFormData] = useState({
		service_id: "",
		quantity: "",
		unit_price: "",
		discount: "",
		payment_method: "Efectivo",
		amount_paid: "",
		customer_name: "",
		notes: ""
	})

	// Search and filter state
	const [searchTerm, setSearchTerm] = useState("")
	const [sortField, setSortField] = useState<keyof SublimationSale>("date")
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
	const [filteredSales, setFilteredSales] = useState<SublimationSale[]>([])

	// Apply filters and search
	useEffect(() => {
		let result = [...sales]

		// Apply search
		if (searchTerm) {
			const lowerSearchTerm = searchTerm.toLowerCase()
			result = result.filter(
				(sale) =>
					sale.service?.name.toLowerCase().includes(lowerSearchTerm) ||
					sale.notes?.toLowerCase().includes(lowerSearchTerm)
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

		setFilteredSales(result)
	}, [sales, searchTerm, sortField, sortDirection])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })
	}

	// Calcular total basado en servicio y cantidad
	const calculateTotal = () => {
		if (!formData.service_id || !formData.quantity) return 0
		
		const selectedService = services.find(s => s.id === formData.service_id)
		if (!selectedService) return 0
		
		const quantity = Number.parseInt(formData.quantity) || 0
		const discount = Number.parseFloat(formData.discount) || 0
		const subtotal = selectedService.base_price * quantity
		return subtotal - discount
	}

	// Calcular vueltos para efectivo
	const calculateChange = () => {
		if (formData.payment_method !== "efectivo") return 0
		const total = calculateTotal()
		const paid = Number.parseFloat(formData.amount_paid) || 0
		return Math.max(0, paid - total)
	}

	const resetForm = () => {
		setFormData({
			service_id: "",
			quantity: "",
			unit_price: "",
			discount: "",
			payment_method: "Efectivo",
			amount_paid: "",
			customer_name: "",
			notes: ""
		})
	}

	const openAddModal = () => {
		resetForm()
		setShowAddModal(true)
	}

	const openEditModal = (sale: SublimationSale) => {
		setCurrentSale(sale)
		setFormData({
			service_id: sale.service_id,
			quantity: sale.quantity.toString(),
			unit_price: sale.unit_price.toString(),
			discount: sale.discount?.toString() || "",
			payment_method: sale.payment_method || "Efectivo",
			amount_paid: sale.amount_paid?.toString() || "",
			customer_name: sale.customer_name || "",
			notes: sale.notes || ""
		})
		// setShowEditModal(true)
	}

	const openDetailsModal = (sale: SublimationSale) => {
		setCurrentSale(sale)
		setShowDetailsModal(true)
	}

	const handleAddSale = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const total = calculateTotal()
			await addSaleToDB({
				date: new Date().toISOString().split('T')[0],
				service_id: formData.service_id,
				quantity: Number.parseInt(formData.quantity),
				unit_price: calculateTotal() / Number.parseInt(formData.quantity), // Precio unitario calculado
				total: total,
				status: 'completed', // Siempre completado
				payment_method: formData.payment_method as 'Efectivo' | 'Tarjeta de crédito' | 'Tarjeta de débito' | 'Transferencia' | 'Otro',
				customer_name: formData.customer_name || undefined,
				discount: Number.parseFloat(formData.discount) || 0,
				amount_paid: Number.parseFloat(formData.amount_paid) || 0,
				change_amount: calculateChange(),
				notes: formData.notes || undefined
			})
			setShowAddModal(false)
			resetForm()
		} catch (error) {
			console.error("Error adding sale:", error)
		}
	}

	// const handleUpdateSale = async (e: React.FormEvent) => {
	// 	e.preventDefault()
	// 	if (!currentSale) return

	// 	try {
	// 		await updateSaleInDB(currentSale.id, {
	// 			service_id: formData.service_id,
	// 			quantity: Number.parseInt(formData.quantity),
	// 			unit_price: Number.parseFloat(formData.unit_price),
	// 			total: Number.parseInt(formData.quantity) * Number.parseFloat(formData.unit_price),
	// 			notes: formData.notes || undefined
	// 		})
	// 		setShowEditModal(false)
	// 		resetForm()
	// 	} catch (error) {
	// 		console.error("Error updating sale:", error)
	// 	}
	// }

	const handleDeleteSale = async (id: string) => {
		if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
			try {
				await deleteSaleFromDB(id)
			} catch (error) {
				console.error("Error deleting sale:", error)
			}
		}
	}

	// const handleStatusChange = async (id: string, newStatus: SublimationSale['status']) => {
	// 	try {
	// 		await updateSaleStatus(id, newStatus)
	// 	} catch (error) {
	// 		console.error("Error updating sale status:", error)
	// 	}
	// }

	const handleSort = (field: keyof SublimationSale) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("asc")
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800'
			case 'in_progress': return 'bg-blue-100 text-blue-800'
			case 'pending': return 'bg-yellow-100 text-yellow-800'
			case 'cancelled': return 'bg-red-100 text-red-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed': return <CheckCircle size={16} />
			case 'in_progress': return <Clock size={16} />
			case 'pending': return <AlertCircle size={16} />
			case 'cancelled': return <X size={16} />
			default: return <AlertCircle size={16} />
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'completed': return 'Completada'
			case 'in_progress': return 'En Proceso'
			case 'pending': return 'Pendiente'
			case 'cancelled': return 'Cancelada'
			default: return status
		}
	}

	const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
	const pendingSales = filteredSales.filter(s => s.status === 'pending').length
	const completedSales = filteredSales.filter(s => s.status === 'completed').length

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center space-x-2">
					<div className="p-2 bg-green-100 rounded-lg">
						<ShoppingCart className="text-green-600 h-6 w-6" />
					</div>
					<div>
						<h2 className="text-xl font-bold text-gray-900">Ventas de Sublimación</h2>
						<p className="text-sm text-gray-500">Gestiona las ventas y pedidos de sublimación</p>
					</div>
				</div>
				<button
					onClick={openAddModal}
					className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
				>
					<Plus size={20} />
					<span>Nueva venta</span>
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Total ventas</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{filteredSales.length}</p>
						</div>
						<div className="p-2 bg-green-100 rounded-full">
							<ShoppingCart className="h-5 w-5 text-green-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Ingresos totales</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalRevenue)}</p>
						</div>
						<div className="p-2 bg-blue-100 rounded-full">
							<DollarSign className="h-5 w-5 text-blue-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Pendientes</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{pendingSales}</p>
						</div>
						<div className="p-2 bg-yellow-100 rounded-full">
							<Clock className="h-5 w-5 text-yellow-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm text-gray-500">Completadas</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{completedSales}</p>
						</div>
						<div className="p-2 bg-green-100 rounded-full">
							<CheckCircle className="h-5 w-5 text-green-600" />
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
							placeholder="Buscar por servicio o notas..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
						/>
					</div>
				</div>
			</div>

			{/* Sales Table */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Servicio
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Cantidad
								</th>
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									onClick={() => handleSort("total")}
								>
									<div className="flex items-center space-x-1">
										<span>Total</span>
										<ArrowUpDown size={14} className="text-gray-400" />
									</div>
								</th>
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									onClick={() => handleSort("date")}
								>
									<div className="flex items-center space-x-1">
										<span>Fecha</span>
										<ArrowUpDown size={14} className="text-gray-400" />
									</div>
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredSales.map((sale) => (
								<tr key={sale.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-6 py-4">
										<div className="text-sm text-gray-900">{sale.service?.name || 'Servicio no encontrado'}</div>
										{sale.notes && (
											<div className="text-xs text-gray-500 truncate max-w-xs">{sale.notes}</div>
										)}
									</td>
									<td className="px-6 py-4">
										<span className="text-sm font-medium text-gray-900">{sale.quantity}</span>
									</td>
									<td className="px-6 py-4">
										<div className="text-sm font-medium text-gray-900">{formatMoney(sale.total)}</div>
										<div className="text-xs text-gray-500">{formatMoney(sale.unit_price)} c/u</div>
									</td>
									<td className="px-6 py-4">
										<div className="text-sm text-gray-900">{new Date(sale.date).toLocaleDateString()}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right">
										<div className="flex items-center justify-end space-x-2">
											<button
												onClick={() => openDetailsModal(sale)}
												className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
												title="Ver detalles"
											>
												<Eye size={16} />
											</button>
											<button
												onClick={() => openEditModal(sale)}
												className="p-1 rounded-md text-green-600 hover:bg-green-50 transition-colors"
												title="Editar venta"
											>
												<Pencil size={16} />
											</button>
											<button
												onClick={() => handleDeleteSale(sale.id)}
												className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
												title="Eliminar venta"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Empty State */}
				{filteredSales.length === 0 && (
					<div className="p-8">
						<div className="flex flex-col items-center justify-center text-gray-500 py-8">
							<div className="p-4 bg-gray-100 rounded-full">
								<ShoppingCart className="h-12 w-12 text-gray-400" />
							</div>
							<h3 className="mt-4 text-lg font-medium text-gray-900">
								{searchTerm 
									? "No se encontraron ventas" 
									: "No hay ventas registradas"}
							</h3>
							<p className="mt-2 text-sm text-gray-500 text-center max-w-md">
								{searchTerm
									? "Intenta con otros términos de búsqueda o elimina los filtros aplicados."
									: "Comienza registrando ventas de sublimación."}
							</p>
							{searchTerm ? (
								<button
									onClick={() => {
										setSearchTerm("")
									}}
									className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
								>
									Limpiar filtros
								</button>
							) : (
								<button
									onClick={openAddModal}
									className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									Registrar primera venta
								</button>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Add Sale Modal */}
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
								<div className="p-2 bg-green-100 rounded-lg">
									<Plus className="h-5 w-5 text-green-600" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900">Nueva Venta</h3>
							</div>
							<p className="text-sm text-gray-500">Registra una nueva venta de sublimación</p>
						</div>
						<form onSubmit={handleAddSale} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
								<select
									name="service_id"
									value={formData.service_id}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
								>
									<option value="">Seleccionar servicio</option>
									{services.length > 0 ? (
										services.map((service) => (
											<option key={service.id} value={service.id}>
												{service.name} - {formatMoney(service.base_price)}
											</option>
										))
									) : (
										<option value="" disabled>No hay servicios disponibles</option>
									)}
								</select>
								{services.length === 0 && (
									<p className="mt-1 text-xs text-red-500">
										No hay servicios de sublimación disponibles. Crea algunos servicios primero.
									</p>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
									<input
										type="number"
										name="quantity"
										value={formData.quantity}
										onChange={handleInputChange}
										required
										min="1"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
										placeholder="1"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Descuento</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<DollarSign className="h-4 w-4 text-gray-400" />
										</div>
										<input
											type="number"
											name="discount"
											value={formData.discount}
											onChange={handleInputChange}
											step="0.01"
											min="0"
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
											placeholder="0.00"
										/>
									</div>
								</div>
							</div>
							
							{/* Mostrar total calculado */}
							{formData.service_id && formData.quantity && (
								<div className="bg-gray-50 p-3 rounded-lg">
									<div className="flex justify-between items-center">
										<span className="text-sm font-medium text-gray-700">Total:</span>
										<span className="text-lg font-bold text-gray-900">{formatMoney(calculateTotal())}</span>
									</div>
								</div>
							)}
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
								<select
									name="payment_method"
									value={formData.payment_method}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
								>
									<option value="efectivo">Efectivo</option>
									<option value="transferencia">Transferencia</option>
								</select>
							</div>
							
							{formData.payment_method === "efectivo" && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<DollarSign className="h-4 w-4 text-gray-400" />
										</div>
										<input
											type="number"
											name="amount_paid"
											value={formData.amount_paid}
											onChange={handleInputChange}
											step="0.01"
											min="0"
											className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
											placeholder="0.00"
										/>
									</div>
									{formData.amount_paid && calculateChange() > 0 && (
										<div className="mt-2 text-sm text-gray-600">
											<span className="font-medium">Vueltos: </span>
											<span className="text-green-600 font-bold">{formatMoney(calculateChange())}</span>
										</div>
									)}
								</div>
							)}
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
								<textarea
									name="notes"
									value={formData.notes}
									onChange={handleInputChange}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
									placeholder="Notas adicionales (opcional)"
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
									className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
								>
									Guardar venta
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Details Modal */}
			{showDetailsModal && currentSale && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-6 w-full max-w-md relative">
						<div className="absolute top-4 right-4">
							<button
								onClick={() => setShowDetailsModal(false)}
								className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
							>
								<X size={20} />
							</button>
						</div>
						<div className="mb-6">
							<div className="flex items-center space-x-3 mb-1">
								<div className="p-2 bg-green-100 rounded-lg">
									<Eye className="h-5 w-5 text-green-600" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900">Detalles de la Venta</h3>
							</div>
						</div>
						<div className="space-y-4">
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-2">Detalles del Servicio</h4>
								<div className="bg-gray-50 rounded-lg p-3 space-y-2">
									<div className="text-sm text-gray-900">{currentSale.service?.name || 'Servicio no encontrado'}</div>
									<div className="text-sm text-gray-600">Cantidad: {currentSale.quantity}</div>
									<div className="text-sm text-gray-600">Precio unitario: {formatMoney(currentSale.unit_price)}</div>
									<div className="text-sm font-medium text-gray-900">Total: {formatMoney(currentSale.total)}</div>
								</div>
							</div>
							{currentSale.notes && (
								<div>
									<h4 className="text-sm font-medium text-gray-700 mb-2">Notas</h4>
									<div className="bg-gray-50 rounded-lg p-3">
										<p className="text-sm text-gray-900">{currentSale.notes}</p>
									</div>
								</div>
							)}
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-2">Estado</h4>
								<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentSale.status)}`}>
									{getStatusIcon(currentSale.status)}
									<span className="ml-1">{getStatusLabel(currentSale.status)}</span>
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default SublimationSales
