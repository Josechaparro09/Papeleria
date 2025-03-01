// src/pages/Recharges.tsx
import React, { useState } from 'react';
import {
  PlusCircle,
  DollarSign,
  Lock,
  Wallet,
  TrendingDown,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { useRecharges } from '../hooks/useRecharges';
import { getTodayISO } from '../utils/dateHelper';
import formatMoney from '../utils/format';

function Recharges() {
  const {
    todayCashRegister,
    transactions,
    loading,
    openCashRegister,
    updateOpeningBalance,
    closeCashRegister,
    addRechargeTransaction,
    updateRechargeTransaction,
    deleteRechargeTransaction,
    getCurrentBalance,
  } = useRecharges();

  const [openingBalance, setOpeningBalance] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState('');
  const [rechargeData, setRechargeData] = useState({ description: '', amount: '' });
  const [editRecharge, setEditRecharge] = useState<{ id: string; description: string; amount: string } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState<{
    action: 'add' | 'edit';
    amount: number;
  } | null>(null);

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    await openCashRegister(Number.parseFloat(openingBalance));
    setOpeningBalance('');
  };

  const handleUpdateOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (todayCashRegister) {
      await updateOpeningBalance(todayCashRegister.id, Number.parseFloat(newOpeningBalance));
      setShowEditBalance(false);
      setNewOpeningBalance('');
    }
  };

  const handleAddRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (todayCashRegister) {
      const amount = Number.parseFloat(rechargeData.amount);
      const currentBalance = getCurrentBalance();
      if (currentBalance - amount < 0 && !showInsufficientBalance) {
        setShowInsufficientBalance({ action: 'add', amount });
        return;
      }
      await addRechargeTransaction(todayCashRegister.id, rechargeData.description, amount);
      setRechargeData({ description: '', amount: '' });
      setShowInsufficientBalance(null);
    }
  };

  const handleEditRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (todayCashRegister && editRecharge) {
      const amount = Number.parseFloat(editRecharge.amount);
      const originalTransaction = transactions.find(t => t.id === editRecharge.id);
      const currentBalanceWithoutOriginal = getCurrentBalance() + (originalTransaction?.amount || 0);
      if (currentBalanceWithoutOriginal - amount < 0 && !showInsufficientBalance) {
        setShowInsufficientBalance({ action: 'edit', amount });
        return;
      }
      await updateRechargeTransaction(editRecharge.id, editRecharge.description, amount);
      setEditRecharge(null);
      setShowInsufficientBalance(null);
    }
  };

  const handleDeleteRecharge = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta recarga?')) {
      await deleteRechargeTransaction(id);
    }
  };

  const handleCloseCash = async () => {
    if (todayCashRegister) {
      await closeCashRegister(todayCashRegister.id);
      setShowCloseConfirm(false);
    }
  };

  const currentBalance = getCurrentBalance();
  const totalRecharges = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Wallet className="mr-2 h-8 w-8 text-blue-600" />
          Control de Recargas
        </h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Abrir caja */}
      {!todayCashRegister && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            Abrir Caja
          </h2>
          <form onSubmit={handleOpenCash} className="space-y-4">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50000"
                required
                min="0"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Abrir Caja
            </button>
          </form>
        </div>
      )}

      {/* Gestión de recargas */}
      {todayCashRegister && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 flex items-center">
                  <DollarSign className="mr-1 h-4 w-4" /> Saldo Inicial
                </p>
                <p className="text-2xl font-bold text-gray-800">{formatMoney(todayCashRegister.opening_balance)}</p>
              </div>
              {!todayCashRegister.closing_balance && (
                <button
                  onClick={() => setShowEditBalance(true)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  title="Editar saldo inicial"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-500 flex items-center">
                <TrendingDown className="mr-1 h-4 w-4" /> Total Recargas
              </p>
              <p className="text-2xl font-bold text-red-600">{formatMoney(totalRecharges)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-500 flex items-center">
                <DollarSign className="mr-1 h-4 w-4" /> Saldo Actual
              </p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(currentBalance)}</p>
            </div>
          </div>

          {/* Registrar recarga */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <PlusCircle className="mr-2 h-5 w-5 text-green-500" />
              Nueva Recarga
            </h2>
            <form onSubmit={handleAddRecharge} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                value={rechargeData.description}
                onChange={(e) => setRechargeData({ ...rechargeData, description: e.target.value })}
                className="sm:col-span-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Recarga Claro"
                required
              />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={rechargeData.amount}
                  onChange={(e) => setRechargeData({ ...rechargeData, amount: e.target.value })}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10000"
                  required
                  min="0"
                />
              </div>
              <button
                type="submit"
                className="sm:col-span-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Agregar Recarga
              </button>
            </form>
          </div>

          {/* Lista de recargas */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Recargas del Día</h2>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay recargas registradas</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-sm font-medium text-gray-600">Descripción</th>
                    <th className="p-3 text-sm font-medium text-gray-600 text-right">Valor</th>
                    <th className="p-3 text-sm font-medium text-gray-600 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-800">{t.description}</td>
                      <td className="p-3 text-right text-red-600">{formatMoney(t.amount)}</td>
                      <td className="p-3 text-right">
                        {!todayCashRegister.closing_balance && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                setEditRecharge({
                                  id: t.id,
                                  description: t.description,
                                  amount: t.amount.toString(),
                                })
                              }
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-full"
                              title="Editar recarga"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecharge(t.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                              title="Eliminar recarga"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Botón cerrar caja */}
          {!todayCashRegister.closing_balance && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <button
                onClick={() => setShowCloseConfirm(true)}
                className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Lock className="mr-2 h-5 w-5" />
                Cerrar Caja
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación de cierre */}
      {showCloseConfirm && todayCashRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Confirmar Cierre de Caja
            </h2>
            <div className="space-y-2 mb-6">
              <p className="text-gray-600">
                <span className="font-medium">Saldo Inicial:</span>{' '}
                {formatMoney(todayCashRegister.opening_balance)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Total Recargas:</span>{' '}
                {formatMoney(totalRecharges)}
              </p>
              <p className="text-gray-600 font-bold">
                <span className="font-medium">Saldo Final:</span>{' '}
                {formatMoney(currentBalance)}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseCash}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de saldo inicial */}
      {showEditBalance && todayCashRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <Edit className="mr-2 h-5 w-5 text-blue-500" />
              Editar Saldo Inicial
            </h2>
            <form onSubmit={handleUpdateOpeningBalance} className="space-y-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={todayCashRegister.opening_balance.toString()}
                  required
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditBalance(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edición de recarga */}
      {editRecharge && todayCashRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <Edit className="mr-2 h-5 w-5 text-blue-500" />
              Editar Recarga
            </h2>
            <form onSubmit={handleEditRecharge} className="space-y-4">
              <input
                type="text"
                value={editRecharge.description}
                onChange={(e) => setEditRecharge({ ...editRecharge, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Recarga Claro"
                required
              />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={editRecharge.amount}
                  onChange={(e) => setEditRecharge({ ...editRecharge, amount: e.target.value })}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10000"
                  required
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditRecharge(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup de saldo insuficiente */}
      {showInsufficientBalance && todayCashRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
              Saldo Insuficiente
            </h2>
            <p className="text-gray-600 mb-4">
              El saldo actual ({formatMoney(currentBalance)}) no es suficiente para registrar esta recarga de{' '}
              {formatMoney(showInsufficientBalance.amount)}. ¿Deseas proceder de todas formas?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowInsufficientBalance(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (showInsufficientBalance.action === 'add') {
                    await addRechargeTransaction(
                      todayCashRegister.id,
                      rechargeData.description,
                      showInsufficientBalance.amount
                    );
                    setRechargeData({ description: '', amount: '' });
                  } else if (editRecharge) {
                    await updateRechargeTransaction(
                      editRecharge.id,
                      editRecharge.description,
                      showInsufficientBalance.amount
                    );
                    setEditRecharge(null);
                  }
                  setShowInsufficientBalance(null);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Proceder
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <span className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      )}
    </div>
  );
}

export default Recharges;