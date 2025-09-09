"use client"

import type React from "react"
import { useState } from "react"
import {
	Palette,
	Package,
	Wrench,
	ShoppingCart,
	Plus,
	BarChart3,
	Users,
	DollarSign,
	TrendingUp,
	Clock,
	CheckCircle,
	AlertCircle,
	X
} from "lucide-react"
import SublimationProducts from "../components/SublimationProducts"
import SublimationServices from "../components/SublimationServices"
import SublimationSales from "../components/SublimationSales"
import { useSublimationProducts } from "../hooks/useSublimationProducts"
import { useSublimationServices } from "../hooks/useSublimationServices"
import { useSublimationSales } from "../hooks/useSublimationSales"

type TabType = 'products' | 'services' | 'sales' | 'dashboard'

function Sublimation() {
	const [activeTab, setActiveTab] = useState<TabType>('dashboard')

	// Obtener datos reales de los hooks
	const { products } = useSublimationProducts()
	const { services } = useSublimationServices()
	const { sales } = useSublimationSales()

	// Calcular estadísticas reales
	const dashboardStats = {
		totalProducts: products.length,
		totalServices: services.length,
		totalSales: sales.length,
		monthlyRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
		pendingOrders: sales.filter(sale => sale.status === 'pending').length,
		completedOrders: sales.filter(sale => sale.status === 'completed').length
	}

	// Obtener ventas recientes (últimas 4)
	const recentSales = sales.slice(0, 4).map(sale => ({
		id: sale.id,
		customer: 'Cliente', // Sin datos de cliente
		service: sale.service?.name || 'Servicio no encontrado',
		amount: sale.total,
		status: sale.status
	}))

	const tabs = [
		{ id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
		{ id: 'products', label: 'Productos Base', icon: Package },
		{ id: 'services', label: 'Servicios', icon: Wrench },
		{ id: 'sales', label: 'Ventas', icon: ShoppingCart }
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800'
			case 'in_progress': return 'bg-blue-100 text-blue-800'
			case 'pending': return 'bg-yellow-100 text-yellow-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed': return <CheckCircle size={16} />
			case 'in_progress': return <Clock size={16} />
			case 'pending': return <AlertCircle size={16} />
			default: return <AlertCircle size={16} />
		}
	}

	const formatMoney = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0
		}).format(amount)
	}

	return (
		<div className="space-y-6 p-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center space-x-2">
					<div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
						<Palette className="text-purple-600 h-6 w-6" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Panel de Sublimación</h1>
						<p className="text-sm text-gray-500">Gestiona productos base, servicios y ventas de sublimación</p>
					</div>
				</div>
			</div>

			{/* Tabs Navigation */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
				<div className="border-b border-gray-200">
					<nav className="flex space-x-8 px-6" aria-label="Tabs">
						{tabs.map((tab) => {
							const Icon = tab.icon
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id as TabType)}
									className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
										activeTab === tab.id
											? 'border-purple-500 text-purple-600'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									<Icon size={18} />
									<span>{tab.label}</span>
								</button>
							)
						})}
					</nav>
				</div>

				{/* Tab Content */}
				<div className="p-6">
					{activeTab === 'dashboard' && (
						<div className="space-y-6">
							{/* Stats Cards */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-blue-100 text-sm font-medium">Productos Base</p>
											<p className="text-3xl font-bold mt-1">{dashboardStats.totalProducts}</p>
										</div>
										<div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
											<Package className="h-6 w-6" />
										</div>
									</div>
									<p className="text-blue-100 text-xs mt-2">Productos disponibles</p>
								</div>

								<div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-purple-100 text-sm font-medium">Servicios Activos</p>
											<p className="text-3xl font-bold mt-1">{dashboardStats.totalServices}</p>
										</div>
										<div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
											<Wrench className="h-6 w-6" />
										</div>
									</div>
									<p className="text-purple-100 text-xs mt-2">Servicios configurados</p>
								</div>

								<div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-green-100 text-sm font-medium">Ventas del Mes</p>
											<p className="text-3xl font-bold mt-1">{dashboardStats.totalSales}</p>
										</div>
										<div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
											<ShoppingCart className="h-6 w-6" />
										</div>
									</div>
									<p className="text-green-100 text-xs mt-2">Órdenes completadas</p>
								</div>

								<div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-orange-100 text-sm font-medium">Ingresos del Mes</p>
											<p className="text-3xl font-bold mt-1">{formatMoney(dashboardStats.monthlyRevenue)}</p>
										</div>
										<div className="p-3 bg-orange-400 bg-opacity-30 rounded-full">
											<DollarSign className="h-6 w-6" />
										</div>
									</div>
									<p className="text-orange-100 text-xs mt-2">Ingresos totales</p>
								</div>

								<div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-yellow-100 text-sm font-medium">Órdenes Pendientes</p>
											<p className="text-3xl font-bold mt-1">{dashboardStats.pendingOrders}</p>
										</div>
										<div className="p-3 bg-yellow-400 bg-opacity-30 rounded-full">
											<Clock className="h-6 w-6" />
										</div>
									</div>
									<p className="text-yellow-100 text-xs mt-2">Requieren atención</p>
								</div>

								<div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-indigo-100 text-sm font-medium">Órdenes Completadas</p>
											<p className="text-3xl font-bold mt-1">{dashboardStats.completedOrders}</p>
										</div>
										<div className="p-3 bg-indigo-400 bg-opacity-30 rounded-full">
											<CheckCircle className="h-6 w-6" />
										</div>
									</div>
									<p className="text-indigo-100 text-xs mt-2">Entregadas exitosamente</p>
								</div>
							</div>

							{/* Recent Sales */}
							<div className="bg-white rounded-lg shadow-sm border border-gray-100">
								<div className="px-6 py-4 border-b border-gray-200">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
										<button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
											Ver todas
										</button>
									</div>
								</div>
								<div className="divide-y divide-gray-200">
									{recentSales.map((sale) => (
										<div key={sale.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<div className="flex items-center space-x-3">
														<div className="flex-shrink-0">
															<div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
																<Users className="h-5 w-5 text-purple-600" />
															</div>
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-gray-900 truncate">
																{sale.customer}
															</p>
															<p className="text-sm text-gray-500 truncate">
																{sale.service}
															</p>
														</div>
													</div>
												</div>
												<div className="flex items-center space-x-4">
													<div className="text-right">
														<p className="text-sm font-medium text-gray-900">
															{formatMoney(sale.amount)}
														</p>
													</div>
													<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
														{getStatusIcon(sale.status)}
														<span className="ml-1 capitalize">{sale.status}</span>
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{activeTab === 'products' && <SublimationProducts />}
					{activeTab === 'services' && <SublimationServices />}
					{activeTab === 'sales' && <SublimationSales />}
				</div>
			</div>
		</div>
	)
}

export default Sublimation
