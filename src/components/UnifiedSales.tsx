"use client"

import { useState, useEffect } from "react"
import {
	ShoppingCart,
	Plus,
	Minus,
	Search,
	X,
	Package,
	Wrench,
	Palette,
	Receipt,
	Trash2,
	CreditCard
} from "lucide-react"
import { useUniversalSalesWithCash } from "../hooks/useUniversalSalesWithCash"
import { useProducts } from "../hooks/useProducts"
import { useServices } from "../hooks/useServices"
import { useSublimationServices } from "../hooks/useSublimationServices"
import { useCashRegister } from "../hooks/useCashRegister"
import formatMoney from "../utils/format"
import toast from "react-hot-toast"

type SaleType = 'product' | 'service' | 'sublimation' | 'recharge'
type PaymentMethod = 'Efectivo' | 'Tarjeta de crédito' | 'Tarjeta de débito' | 'Transferencia' | 'Otro'

interface CartItem {
	id: string
	name: string
	type: SaleType
	price: number
	quantity: number
	subtotal: number
	description?: string
	originalItem: any // Referencia al item original
}

export default function UnifiedSales() {
	// Hooks para datos
	const { addSale } = useUniversalSalesWithCash()
	const { products } = useProducts()
	const { services } = useServices()
	const { services: sublimationServices } = useSublimationServices()
	const { addRechargeTransaction, isOpen: cashIsOpen } = useCashRegister()

	// Estado principal
	const [activeTab, setActiveTab] = useState<SaleType>('product')
	const [cart, setCart] = useState<CartItem[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	
	// Estado para recargas
	const [rechargeDescription, setRechargeDescription] = useState('')
	const [rechargeAmount, setRechargeAmount] = useState('')
	const [rechargePaymentMethod, setRechargePaymentMethod] = useState<PaymentMethod>('Efectivo')
	// Removed showCart state - simplified UX
	const [showPaymentModal, setShowPaymentModal] = useState(false)

	// Información de pago
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo')
	const [amountPaid, setAmountPaid] = useState('')
	const [discount, setDiscount] = useState('')
	const [notes, setNotes] = useState('')

	// Filtros y búsqueda
	const [filteredItems, setFilteredItems] = useState<any[]>([])

	// Aplicar filtros y búsqueda
	useEffect(() => {
		let items: any[] = []
		
		switch (activeTab) {
			case 'product':
				items = products
				break
			case 'service':
				items = services
				break
			case 'sublimation':
				items = sublimationServices
				break
			case 'recharge':
				// Para recargas, no mostramos items en la lista, se maneja diferente
				items = []
				break
		}

		if (searchTerm) {
			items = items.filter(item => 
				item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.description?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		setFilteredItems(items)
	}, [activeTab, searchTerm, products, services, sublimationServices])

	// Agregar item al carrito
	const addToCart = (item: any) => {
		// Las recargas no se agregan al carrito, se manejan directamente
		if (activeTab === 'recharge') {
			return
		}

		const existingItem = cart.find(cartItem => 
			cartItem.id === item.id && cartItem.type === activeTab
		)

		if (existingItem) {
			updateQuantity(existingItem.id, existingItem.quantity + 1)
		} else {
			const price = activeTab === 'sublimation' 
				? (item.base_price + item.sublimation_cost)
				: item.public_price || item.price

			const newItem: CartItem = {
				id: item.id,
				name: item.name,
				type: activeTab,
				price: price,
				quantity: 1,
				subtotal: price,
				description: item.description,
				originalItem: item
			}

			setCart([...cart, newItem])
			toast.success(`${item.name} agregado al carrito`, {
				icon: '🛒',
				style: {
					background: '#10B981',
					color: '#fff',
				},
			})
		}
	}

	// Actualizar cantidad
	const updateQuantity = (itemId: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			removeFromCart(itemId)
			return
		}

		setCart(cart.map(item => 
			item.id === itemId 
				? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
				: item
		))
	}

	// Remover del carrito
	const removeFromCart = (itemId: string) => {
		setCart(cart.filter(item => item.id !== itemId))
		toast.success('Item removido del carrito', {
			icon: '🗑️',
			style: {
				background: '#EF4444',
				color: '#fff',
			},
		})
	}

	// Calcular totales
	const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
	const discountAmount = parseFloat(discount) || 0
	const tax = 0 // Por ahora sin impuestos
	const total = subtotal - discountAmount + tax
	const change = paymentMethod === 'Efectivo' ? Math.max(0, (parseFloat(amountPaid) || 0) - total) : 0

	// Procesar venta
	const handleCheckout = async () => {
		if (cart.length === 0) {
			toast.error('El carrito está vacío')
			return
		}

		if (paymentMethod === 'Efectivo' && (parseFloat(amountPaid) || 0) < total) {
			toast.error('El monto pagado es menor al total')
			return
		}

		try {
			console.log('Iniciando checkout con:', { paymentMethod, total, amountPaid });
			
			// Preparar datos de la venta
			const saleData = {
				date: new Date().toISOString().split('T')[0],
				subtotal: subtotal,
				discount: discountAmount,
				tax: tax,
				customer_name: undefined,
				customer_phone: undefined,
				customer_email: undefined,
				payment_method: paymentMethod,
				amount_paid: paymentMethod === 'Efectivo' ? parseFloat(amountPaid) : undefined,
				change_amount: paymentMethod === 'Efectivo' ? change : undefined,
				status: 'completed' as const,
				notes: notes || undefined
			}

			// Preparar items de la venta (solo tipos válidos para ventas)
			const saleItems = cart
				.filter(item => item.type !== 'recharge') // Filtrar recargas
				.map(item => ({
					item_type: item.type as 'product' | 'service' | 'sublimation',
					product_id: item.type === 'product' ? item.id : undefined,
					service_id: item.type === 'service' ? item.id : undefined,
					sublimation_service_id: item.type === 'sublimation' ? item.id : undefined,
					item_name: item.name,
					description: item.description,
					quantity: item.quantity,
					unit_price: item.price
				}))

			await addSale(saleData, saleItems)

			// Limpiar formulario
			setCart([])
			setPaymentMethod('Efectivo')
			setAmountPaid('')
			setDiscount('')
			setNotes('')
			setShowPaymentModal(false)
			// Removed setShowCart - simplified UX

			toast.success('¡Venta procesada exitosamente! 🎉', {
				icon: '✅',
				style: {
					background: '#10B981',
					color: '#fff',
				},
			})
		} catch (error) {
			console.error('Error processing sale:', error)
			toast.error('Error al procesar la venta')
		}
	}

	const handleRecharge = async () => {
		if (!rechargeDescription.trim() || !rechargeAmount.trim()) {
			toast.error('Por favor completa la descripción y el monto')
			return
		}

		if (!cashIsOpen) {
			toast.error('La caja debe estar abierta para realizar recargas')
			return
		}

		try {
			await addRechargeTransaction(rechargeDescription, parseFloat(rechargeAmount), rechargePaymentMethod)
			setRechargeDescription('')
			setRechargeAmount('')
			setRechargePaymentMethod('Efectivo')
			toast.success('Recarga registrada exitosamente')
		} catch (error) {
			console.error('Error al procesar recarga:', error)
		}
	}

	// Obtener icono según tipo
	const getTypeIcon = (type: SaleType) => {
		switch (type) {
			case 'product': return <Package size={16} />
			case 'service': return <Wrench size={16} />
			case 'sublimation': return <Palette size={16} />
			case 'recharge': return <CreditCard size={16} />
		}
	}

	// Obtener color según tipo
	const getTypeColor = (type: SaleType) => {
		switch (type) {
			case 'product': return 'bg-blue-100 text-blue-800'
			case 'service': return 'bg-green-100 text-green-800'
			case 'sublimation': return 'bg-purple-100 text-purple-800'
			case 'recharge': return 'bg-orange-100 text-orange-800'
		}
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Top Navigation */}
			<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex">
						{[
							{ id: 'product', label: 'Productos', icon: Package },
							{ id: 'service', label: 'Servicios', icon: Wrench },
							{ id: 'sublimation', label: 'Sublimación', icon: Palette },
							{ id: 'recharge', label: 'Recargas', icon: CreditCard }
						].map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								onClick={() => setActiveTab(id as SaleType)}
								className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
									activeTab === id
										? 'text-blue-600 border-blue-600 bg-blue-50'
										: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
								}`}
							>
								<Icon size={16} />
								<span>{label}</span>
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div className="grid grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
					{/* Left Sidebar - Product Selection */}
					<div className="col-span-12 lg:col-span-8 flex flex-col h-full">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
							{/* Search */}
							<div className="p-4 border-b border-gray-200">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
									<input
										type="text"
										placeholder={`Buscar ${activeTab === 'product' ? 'productos' : activeTab === 'service' ? 'servicios' : 'servicios de sublimación'}...`}
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
									/>
									{searchTerm && (
										<button
											onClick={() => setSearchTerm('')}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											<X size={14} />
										</button>
									)}
								</div>
							</div>

							{/* Product Grid / Recharge Interface */}
							<div className="flex-1 overflow-y-auto p-4">
								{activeTab === 'recharge' ? (
									/* Interfaz de Recargas */
									<div className="max-w-md mx-auto">
										<div className="bg-white rounded-lg border border-gray-200 p-6">
											<div className="text-center mb-6">
												<div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
													<CreditCard className="w-6 h-6 text-orange-600" />
												</div>
												<h3 className="text-lg font-semibold text-gray-900">Nueva Recarga</h3>
												<p className="text-sm text-gray-500">Registra una recarga de saldo</p>
											</div>

											<div className="space-y-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														Descripción
													</label>
													<input
														type="text"
														value={rechargeDescription}
														onChange={(e) => setRechargeDescription(e.target.value)}
														placeholder="Ej: Recarga Claro, Pago proveedor, etc."
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
													/>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														Monto
													</label>
													<input
														type="number"
														value={rechargeAmount}
														onChange={(e) => setRechargeAmount(e.target.value)}
														placeholder="0"
														min="0"
														step="0.01"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
													/>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														Método de Pago
													</label>
													<select
														value={rechargePaymentMethod}
														onChange={(e) => setRechargePaymentMethod(e.target.value as PaymentMethod)}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
													>
														<option value="Efectivo">Efectivo</option>
														<option value="Tarjeta de crédito">Tarjeta de crédito</option>
														<option value="Tarjeta de débito">Tarjeta de débito</option>
														<option value="Transferencia">Transferencia</option>
														<option value="Otro">Otro</option>
													</select>
												</div>

												<button
													onClick={handleRecharge}
													disabled={!rechargeDescription.trim() || !rechargeAmount.trim() || !cashIsOpen}
													className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
												>
													{cashIsOpen ? 'Registrar Recarga' : 'Caja Cerrada'}
												</button>

												{!cashIsOpen && (
													<p className="text-sm text-red-600 text-center">
														La caja debe estar abierta para realizar recargas
													</p>
												)}
											</div>
										</div>
									</div>
								) : filteredItems.length === 0 ? (
									<div className="text-center py-8">
										<div className="text-gray-400 mb-2">
											{getTypeIcon(activeTab)}
										</div>
										<p className="text-gray-500 text-sm">
											{searchTerm ? 'No se encontraron resultados' : `No hay ${activeTab === 'product' ? 'productos' : activeTab === 'service' ? 'servicios' : 'servicios de sublimación'} disponibles`}
										</p>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
										{filteredItems.map((item) => (
											<div
												key={item.id}
												className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
												onClick={() => addToCart(item)}
											>
												<div className="flex items-start justify-between mb-2">
													<div className="flex items-center space-x-2">
														<div className={`p-1.5 rounded ${getTypeColor(activeTab)}`}>
															{getTypeIcon(activeTab)}
														</div>
														<h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600">
															{item.name}
														</h3>
													</div>
													<button className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white p-1 rounded-full transition-opacity">
														<Plus size={14} />
													</button>
												</div>
												{item.description && (
													<p className="text-xs text-gray-500 mb-2 line-clamp-2">
														{item.description}
													</p>
												)}
												<div className="flex items-center justify-between">
													<span className="text-lg font-bold text-gray-900">
														{formatMoney(activeTab === 'sublimation' 
															? (item.base_price + item.sublimation_cost)
															: item.public_price || item.price
														)}
													</span>
													<span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(activeTab)}`}>
														{activeTab === 'product' ? 'Producto' : activeTab === 'service' ? 'Servicio' : 'Sublimación'}
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Sidebar - Cart */}
					<div className="col-span-12 lg:col-span-4">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4 overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
							{/* Cart Header */}
							<div className="p-4 border-b border-gray-200 bg-gray-50">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-gray-900 flex items-center space-x-2">
										<ShoppingCart size={18} />
										<span>Carrito</span>
									</h3>
									{cart.length > 0 && (
										<span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
											{cart.length}
										</span>
									)}
								</div>
							</div>

							{cart.length === 0 ? (
								<div className="flex-1 flex items-center justify-center p-6">
									<div className="text-center">
										<ShoppingCart size={32} className="text-gray-300 mx-auto mb-3" />
										<p className="text-gray-500 text-sm">Carrito vacío</p>
									</div>
								</div>
							) : (
								<div className="flex-1 flex flex-col min-h-0">
									{/* Cart Items */}
									<div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
										{cart.map((item) => (
											<div key={`${item.id}-${item.type}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
												<div className="flex items-start justify-between mb-2">
													<div className="flex items-center space-x-2 flex-1 min-w-0">
														<div className={`p-1 rounded ${getTypeColor(item.type)}`}>
															{getTypeIcon(item.type)}
														</div>
														<div className="min-w-0 flex-1">
															<h4 className="font-medium text-gray-900 text-sm truncate">
																{item.name}
															</h4>
															<p className="text-xs text-gray-500">
																{formatMoney(item.price)} c/u
															</p>
														</div>
													</div>
													<button
														onClick={() => removeFromCart(item.id)}
														className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
													>
														<Trash2 size={12} />
													</button>
												</div>
												
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-2">
														<button
															onClick={() => updateQuantity(item.id, item.quantity - 1)}
															className="p-1 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
														>
															<Minus size={12} />
														</button>
														<span className="text-sm font-medium w-6 text-center">
															{item.quantity}
														</span>
														<button
															onClick={() => updateQuantity(item.id, item.quantity + 1)}
															className="p-1 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
														>
															<Plus size={12} />
														</button>
													</div>
													<span className="text-sm font-bold text-blue-600">
														{formatMoney(item.subtotal)}
													</span>
												</div>
											</div>
										))}
									</div>

									{/* Cart Summary */}
									<div className="p-3 border-t border-gray-200 bg-gray-50">
										<div className="space-y-2 mb-3">
											<div className="flex justify-between text-sm">
												<span className="text-gray-600">Subtotal:</span>
												<span className="font-medium">{formatMoney(subtotal)}</span>
											</div>
											{discountAmount > 0 && (
												<div className="flex justify-between text-sm">
													<span className="text-gray-600">Descuento:</span>
													<span className="font-medium text-red-600">-{formatMoney(discountAmount)}</span>
												</div>
											)}
											<div className="flex justify-between text-sm">
												<span className="text-gray-600">Impuestos:</span>
												<span className="font-medium">{formatMoney(tax)}</span>
											</div>
											<div className="border-t border-gray-300 pt-2">
												<div className="flex justify-between font-bold">
													<span>Total:</span>
													<span className="text-blue-600">{formatMoney(total)}</span>
												</div>
											</div>
										</div>

										<button
											onClick={() => setShowPaymentModal(true)}
											className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
										>
											<Receipt size={16} />
											<span>Procesar Venta</span>
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Modal de pago minimalista */}
			{showPaymentModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-semibold text-gray-900">Finalizar Venta</h3>
							<button
								onClick={() => setShowPaymentModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={20} />
							</button>
						</div>

						<div className="space-y-4">
							{/* Resumen */}
							<div className="bg-gray-50 rounded-lg p-4">
								<div className="flex justify-between text-sm mb-2">
									<span className="text-gray-600">Items:</span>
									<span className="font-medium">{cart.length}</span>
								</div>
								<div className="flex justify-between text-sm mb-2">
									<span className="text-gray-600">Subtotal:</span>
									<span className="font-medium">{formatMoney(subtotal)}</span>
								</div>
								<div className="flex justify-between font-bold border-t border-gray-300 pt-2">
									<span>Total:</span>
									<span className="text-blue-600">{formatMoney(total)}</span>
								</div>
							</div>

							{/* Método de pago */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Método de Pago
								</label>
								<select
									value={paymentMethod}
									onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								>
									<option value="Efectivo">Efectivo</option>
									<option value="Tarjeta de crédito">Tarjeta de crédito</option>
									<option value="Tarjeta de débito">Tarjeta de débito</option>
									<option value="Transferencia">Transferencia</option>
									<option value="Otro">Otro</option>
								</select>
							</div>

							{/* Descuento */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Descuento
								</label>
								<input
									type="number"
									placeholder="0"
									value={discount}
									onChange={(e) => setDiscount(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								/>
							</div>

							{/* Monto pagado (solo para efectivo) */}
							{paymentMethod === 'Efectivo' && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Monto Pagado
									</label>
									<input
										type="number"
										placeholder="0"
										value={amountPaid}
										onChange={(e) => setAmountPaid(e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									/>
									{change > 0 && (
										<p className="text-sm text-green-600 mt-1">
											Vueltos: {formatMoney(change)}
										</p>
									)}
								</div>
							)}

							{/* Notas */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Notas
								</label>
								<textarea
									placeholder="Notas adicionales..."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={2}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
								/>
							</div>

							{/* Botones */}
							<div className="flex space-x-3 pt-2">
								<button
									onClick={() => setShowPaymentModal(false)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
								>
									Cancelar
								</button>
								<button
									onClick={handleCheckout}
									className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
								>
									Confirmar Venta
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}