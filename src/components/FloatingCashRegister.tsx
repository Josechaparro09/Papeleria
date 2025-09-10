// src/components/FloatingCashRegister.tsx
import React, { useState, useEffect } from 'react';
import {
	Wallet,
	DollarSign,
	Plus,
	Minus,
	Lock,
	Unlock,
	TrendingUp,
	TrendingDown,
	RefreshCw,
	X,
	ChevronDown,
	ChevronUp,
	Calculator,
	Receipt
} from 'lucide-react';
import { useCashRegister } from '../hooks/useCashRegister';
import formatMoney from '../utils/format';

function FloatingCashRegister() {
	const {
		cashRegister,
		transactions,
		stats,
		loading,
		isOpen,
		openCashRegister,
		closeCashRegister,
		addRechargeTransaction,
		refreshStats
	} = useCashRegister();

	const [isExpanded, setIsExpanded] = useState(false);
	const [showOpenModal, setShowOpenModal] = useState(false);
	const [showCloseModal, setShowCloseModal] = useState(false);
	const [showRechargeModal, setShowRechargeModal] = useState(false);
	const [openingBalance, setOpeningBalance] = useState('');
	const [closingBalance, setClosingBalance] = useState('');
	const [rechargeData, setRechargeData] = useState({ description: '', amount: '' });

	// Refrescar estadísticas cuando el componente se monta
	useEffect(() => {
		if (isOpen && cashRegister) {
			console.log('Componente de caja montado, refrescando estadísticas...');
			refreshStats();
		}
	}, [isOpen, cashRegister, refreshStats]);

	const handleOpenCash = async (e: React.FormEvent) => {
		e.preventDefault();
		if (openingBalance) {
			await openCashRegister(Number(openingBalance));
			setOpeningBalance('');
			setShowOpenModal(false);
		}
	};

	const handleCloseCash = async (e: React.FormEvent) => {
		e.preventDefault();
		if (closingBalance) {
			await closeCashRegister(Number(closingBalance));
			setClosingBalance('');
			setShowCloseModal(false);
		}
	};

	const handleAddRecharge = async (e: React.FormEvent) => {
		e.preventDefault();
		if (rechargeData.description && rechargeData.amount) {
			await addRechargeTransaction(rechargeData.description, Number(rechargeData.amount));
			setRechargeData({ description: '', amount: '' });
			setShowRechargeModal(false);
		}
	};

	const getStatusColor = () => {
		if (!isOpen) return 'bg-red-500';
		if (stats.currentBalance < 0) return 'bg-yellow-500';
		return 'bg-green-500';
	};

	const getStatusText = () => {
		if (!isOpen) return 'Caja Cerrada';
		if (stats.currentBalance < 0) return 'Balance Negativo';
		return 'Caja Abierta';
	};

	if (loading) {
		return (
			<div className="fixed bottom-4 right-4 z-50">
				<div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
					<div className="flex items-center space-x-2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
						<span className="text-sm text-gray-600">Cargando...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* Botón flotante principal */}
			<div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
				<div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
					{/* Header compacto */}
					<div 
						className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						<div className="flex items-center space-x-3">
							<div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
							<div className="flex items-center space-x-2">
								<Wallet className="h-5 w-5 text-gray-600" />
								<span className="text-sm font-medium text-gray-700">
									{getStatusText()}
								</span>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<span className="text-sm font-bold text-gray-900">
								{formatMoney(stats.currentBalance)}
							</span>
							{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
						</div>
					</div>

					{/* Contenido expandido - Compacto y organizado */}
					{isExpanded && (
						<div className="border-t border-gray-200 p-3 space-y-3 max-h-96 overflow-y-auto">
							{/* Resumen principal compacto */}
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div className="bg-green-50 p-2 rounded">
									<div className="text-green-700 font-medium">Total Ventas</div>
									<div className="font-bold text-green-800 text-sm">
										{formatMoney(stats.totalSales)}
									</div>
								</div>
								<div className="bg-red-50 p-2 rounded">
									<div className="text-red-700 font-medium">Gastos</div>
									<div className="font-bold text-red-800 text-sm">
										{formatMoney(stats.totalExpenses)}
									</div>
								</div>
							</div>

							{/* Ventas por categoría - Compacto */}
							<div className="space-y-1">
								<div className="text-xs font-medium text-gray-600">Ventas</div>
								<div className="grid grid-cols-2 gap-1 text-xs">
									<div className="bg-blue-50 p-1.5 rounded">
										<div className="text-blue-700">Productos</div>
										<div className="font-bold text-blue-800">
											{formatMoney(stats.productSales || 0)}
										</div>
									</div>
									<div className="bg-green-50 p-1.5 rounded">
										<div className="text-green-700">Servicios</div>
										<div className="font-bold text-green-800">
											{formatMoney(stats.serviceSales || 0)}
										</div>
									</div>
									<div className="bg-purple-50 p-1.5 rounded">
										<div className="text-purple-700">Sublimación</div>
										<div className="font-bold text-purple-800">
											{formatMoney(stats.sublimationSales || 0)}
										</div>
									</div>
									<div className="bg-orange-50 p-1.5 rounded">
										<div className="text-orange-700">Efectivo</div>
										<div className="font-bold text-orange-800">
											{formatMoney(stats.cashSales || 0)}
										</div>
									</div>
								</div>
							</div>

							{/* Recargas - Compacto */}
							<div className="space-y-1">
								<div className="text-xs font-medium text-gray-600">Recargas</div>
								<div className="space-y-1 text-xs">
									<div className="flex justify-between items-center bg-green-50 p-1.5 rounded">
										<span className="text-green-700">Efectivo</span>
										<span className="font-bold text-green-800">
											{formatMoney(stats.cashRecharges || 0)}
										</span>
									</div>
									<div className="flex justify-between items-center bg-blue-50 p-1.5 rounded">
										<span className="text-blue-700">Transferencia</span>
										<span className="font-bold text-blue-800">
											{formatMoney(stats.transferRecharges || 0)}
										</span>
									</div>
									<div className="flex justify-between items-center bg-purple-50 p-1.5 rounded">
										<span className="text-purple-700">Otros</span>
										<span className="font-bold text-purple-800">
											{formatMoney(stats.otherRecharges || 0)}
										</span>
									</div>
								</div>
							</div>

							{/* Balance detallado - Compacto */}
							<div className="bg-gray-50 p-2 rounded space-y-1">
								<div className="flex justify-between items-center">
									<span className="text-xs text-gray-600">Balance Actual</span>
									<span className="text-sm font-bold text-gray-900">
										{formatMoney(stats.currentBalance)}
									</span>
								</div>
								
								{/* Desglose compacto */}
								<div className="space-y-0.5 text-xs">
									<div className="flex justify-between items-center">
										<span className="text-gray-500">Inicial</span>
										<span className="text-gray-700">
											{formatMoney(stats.openingBalance)}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-500">+ Ventas</span>
										<span className="text-green-600">
											+{formatMoney(stats.cashSales || 0)}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-500">+ Recargas</span>
										<span className="text-green-600">
											+{formatMoney(stats.cashRecharges || 0)}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-500">- Gastos</span>
										<span className="text-red-600">
											-{formatMoney(stats.totalExpenses)}
										</span>
									</div>
								</div>

								{cashRegister && (
									<div className="flex justify-between items-center pt-1 border-t text-xs text-gray-500">
										<span>ID: {cashRegister.id.slice(0, 6)}...</span>
										<span>{new Date(cashRegister.created_at).toLocaleTimeString()}</span>
									</div>
								)}
							</div>

							{/* Botones de acción - Compactos */}
							<div className="flex space-x-1">
								{!isOpen ? (
									<button
										onClick={() => setShowOpenModal(true)}
										className="flex-1 bg-green-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
									>
										<Unlock className="h-3 w-3" />
										<span>Abrir</span>
									</button>
								) : (
									<>
										<button
											onClick={() => setShowRechargeModal(true)}
											className="flex-1 bg-blue-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
										>
											<Plus className="h-3 w-3" />
											<span>Recarga</span>
										</button>
										<button
											onClick={() => setShowCloseModal(true)}
											className="flex-1 bg-red-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
										>
											<Lock className="h-3 w-3" />
											<span>Cerrar</span>
										</button>
									</>
								)}
								<button
									onClick={() => {
										console.log('Actualización manual de caja...');
										refreshStats();
									}}
									className="bg-gray-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
									title="Actualizar datos de caja"
								>
									<RefreshCw className="h-3 w-3" />
								</button>
							</div>

							{/* Transacciones recientes - Compacto */}
							{transactions.length > 0 && (
								<div className="space-y-1">
									<div className="text-xs font-medium text-gray-600">Recargas Recientes</div>
									<div className="max-h-16 overflow-y-auto space-y-0.5">
										{transactions.slice(0, 2).map((transaction) => (
											<div key={transaction.id} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded">
												<span className="truncate text-gray-700">{transaction.description}</span>
												<span className="font-medium text-green-600">
													+{formatMoney(transaction.amount)}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Modal para abrir caja */}
			{showOpenModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-900">Abrir Caja</h3>
							<button
								onClick={() => setShowOpenModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form onSubmit={handleOpenCash} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Saldo de Apertura
								</label>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
									<input
										type="number"
										value={openingBalance}
										onChange={(e) => setOpeningBalance(e.target.value)}
										className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
										placeholder="50000"
										required
										min="0"
									/>
								</div>
							</div>
							<div className="flex space-x-3">
								<button
									type="button"
									onClick={() => setShowOpenModal(false)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
								>
									<Unlock className="h-4 w-4" />
									<span>Abrir Caja</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal para cerrar caja */}
			{showCloseModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-900">Cerrar Caja</h3>
							<button
								onClick={() => setShowCloseModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form onSubmit={handleCloseCash} className="space-y-4">
							<div className="bg-gray-50 p-3 rounded">
								<div className="text-sm text-gray-600 mb-1">Balance Calculado</div>
								<div className="text-lg font-bold text-gray-900">
									{formatMoney(stats.currentBalance)}
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Saldo de Cierre
								</label>
								<div className="relative">
									<Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
									<input
										type="number"
										value={closingBalance}
										onChange={(e) => setClosingBalance(e.target.value)}
										className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
										placeholder={stats.currentBalance.toString()}
										required
										min="0"
									/>
								</div>
							</div>
							<div className="flex space-x-3">
								<button
									type="button"
									onClick={() => setShowCloseModal(false)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
								>
									<Lock className="h-4 w-4" />
									<span>Cerrar Caja</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal para recarga */}
			{showRechargeModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-900">Nueva Recarga</h3>
							<button
								onClick={() => setShowRechargeModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form onSubmit={handleAddRecharge} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Descripción
								</label>
								<input
									type="text"
									value={rechargeData.description}
									onChange={(e) => setRechargeData(prev => ({ ...prev, description: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Recarga Claro, Pago proveedor, etc."
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Monto
								</label>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
									<input
										type="number"
										value={rechargeData.amount}
										onChange={(e) => setRechargeData(prev => ({ ...prev, amount: e.target.value }))}
										className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder="10000"
										required
										min="0"
									/>
								</div>
							</div>
							<div className="flex space-x-3">
								<button
									type="button"
									onClick={() => setShowRechargeModal(false)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
								>
									<Plus className="h-4 w-4" />
									<span>Agregar</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}

export default FloatingCashRegister;
