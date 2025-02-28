// src/pages/Recharges.tsx
import React, { useState } from 'react';
import { 
  PlusCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  DollarSign, 
  Edit, 
  Trash2, 
  X, 
  Clock, 
  FileText, 
  TrendingUp,
  Download,
  Printer,
  Smartphone,
  Info
} from 'lucide-react';
import { useRecharges } from '../hooks/useRecharges';
import { Recharge } from '../types/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTodayISO } from '../utils/dateHelper';
import { format as formatDate } from 'date-fns';import formatMoney from '../utils/format';

function Recharges() {
  const { recharges, todayRecharge, loading, addRecharge, updateRecharge, deleteRecharge, getRechargeByDate } = useRecharges();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRecharge, setCurrentRecharge] = useState<Recharge | null>(null);
  
  // Obtener la fecha actual en formato ISO (YYYY-MM-DD)
  const today = getTodayISO();
  
  const [formData, setFormData] = useState({
    date: today,
    opening_balance: '',
    closing_balance: '',
    profit: '',
    notes: ''
  });

  // Estado para mostrar alerta de recarga existente
  const [existingRechargeWarning, setExistingRechargeWarning] = useState<Recharge | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Si cambia la fecha, verificar si ya existe una recarga para esa fecha
    if (name === 'date' && value) {
      const existingRecharge = getRechargeByDate(value);
      setExistingRechargeWarning(existingRecharge);
      
      // Si existe, prellenar el formulario con los datos existentes
      if (existingRecharge && showAddModal) {
        setFormData({
          date: value,
          opening_balance: existingRecharge.opening_balance.toString(),
          closing_balance: existingRecharge.closing_balance.toString(),
          profit: existingRecharge.profit?.toString() || '',
          notes: existingRecharge.notes || ''
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      date: today,
      opening_balance: '',
      closing_balance: '',
      profit: '',
      notes: ''
    });
    setExistingRechargeWarning(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
    
    // Verificar si ya existe una recarga para la fecha actual
    const existingRecharge = getRechargeByDate(today);
    setExistingRechargeWarning(existingRecharge);
  };

  const openEditModal = (recharge: Recharge) => {
    setCurrentRecharge(recharge);
    setFormData({
      date: recharge.date,  // Usar directamente la fecha ISO sin conversión
      opening_balance: recharge.opening_balance.toString(),
      closing_balance: recharge.closing_balance.toString(),
      profit: recharge.profit?.toString() || '',
      notes: recharge.notes || ''
    });
    setShowEditModal(true);
    setExistingRechargeWarning(null);
  };

  const handleAddRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRecharge({
        date: formData.date,
        opening_balance: Number.parseFloat(formData.opening_balance),
        closing_balance: Number.parseFloat(formData.closing_balance),
        profit: formData.profit ? Number.parseFloat(formData.profit) : undefined,
        notes: formData.notes || undefined
      });
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding recharge:', error);
    }
  };

  const handleUpdateRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecharge) return;

    try {
      await updateRecharge(currentRecharge.id, {
        date: formData.date,
        opening_balance: Number.parseFloat(formData.opening_balance),
        closing_balance: Number.parseFloat(formData.closing_balance),
        profit: formData.profit ? Number.parseFloat(formData.profit) : undefined,
        notes: formData.notes || undefined
      });
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating recharge:', error);
    }
  };

  const handleDeleteRecharge = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await deleteRecharge(id);
      } catch (error) {
        console.error('Error deleting recharge:', error);
      }
    }
  };

  // Calcular totales para todos los registros
  const calculateTotals = () => {
    const totalSales = recharges.reduce((sum, recharge) => sum + recharge.sales_amount, 0);
    const totalProfit = recharges.reduce((sum, recharge) => sum + (recharge.profit || 0), 0);
    return { totalSales, totalProfit };
  };

  const { totalSales, totalProfit } = calculateTotals();

  // Verificar si hay un registro para hoy
  const hasTodayRecharge = !!todayRecharge;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="text-blue-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recargas</h1>
            <p className="text-sm text-gray-500">Gestiona tus recargas diarias</p>
          </div>
        </div>
        <div>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={20} />
            <span>Registrar Recarga</span>
          </button>
        </div>
      </div>

      {/* Resumen de recargas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Ventas totales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalSales)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total acumulado de ventas de recargas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Ganancias totales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalProfit)}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total acumulado de ganancias por recargas
          </p>
        </div>

        {todayRecharge && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Recargas de hoy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(todayRecharge.sales_amount)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <ArrowUpCircle className="h-3 w-3 text-green-500 mr-1" />
              <span>Inicial: {formatMoney(todayRecharge.opening_balance)}</span>
              <span className="mx-2">•</span>
              <ArrowDownCircle className="h-3 w-3 text-red-500 mr-1" />
              <span>Final: {formatMoney(todayRecharge.closing_balance)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de registros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Historial de recargas</h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {}}
              className="p-2 rounded-lg border text-gray-700 border-gray-300 hover:bg-gray-50"
              title="Exportar datos"
              style={{ display: 'none' }}
            >
            </button>
            <button
              onClick={() => {}}
              className="p-2 rounded-lg border text-gray-700 border-gray-300 hover:bg-gray-50"
              title="Imprimir reporte"
              style={{ display: 'none' }}
            >
              <Printer size={16} className="text-gray-600"/>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Cargando registros...</p>
          </div>
        ) : recharges.length === 0 ? (
          <div className="p-8 text-center">
            <Smartphone className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No hay registros</h3>
            <p className="mt-2 text-sm text-gray-500">
              Comienza registrando las recargas del día
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Añadir primer registro
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo inicial
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo final
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ganancia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recharges.map((recharge) => (
                  <tr key={recharge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(recharge.date, 'EEEE, d MMMM yyyy')}
                            {recharge.date === today && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                Hoy
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(recharge.created_at), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{formatMoney(recharge.opening_balance)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{formatMoney(recharge.closing_balance)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-green-600">{formatMoney(recharge.sales_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-purple-600">
                        {recharge.profit ? formatMoney(recharge.profit) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(recharge)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Editar registro"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecharge(recharge.id)}
                          className="p-1 rounded-md text-red-600 hover:bg-red-50"
                          title="Eliminar registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar recarga */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
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
                  <PlusCircle className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Registrar Recargas</h3>
              </div>
              <p className="text-sm text-gray-500">Registra el balance de recargas del día</p>
            </div>
            
            {/* Alerta si ya existe una recarga para la fecha seleccionada */}
            {existingRechargeWarning && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-700 font-medium">Ya existe un registro para esta fecha</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Si continúas, actualizarás el registro existente con los nuevos datos.
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleAddRecharge} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo inicial</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="50000"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Saldo disponible al inicio del día
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo final</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="closing_balance"
                    value={formData.closing_balance}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="20000"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Saldo restante al final del día
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia (opcional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="profit"
                    value={formData.profit}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="5000"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Ganancia obtenida por las recargas
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Observaciones adicionales..."
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end space-x-3">
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
                  {existingRechargeWarning ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar recarga */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
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
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Edit className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Editar Recargas</h3>
              </div>
              <p className="text-sm text-gray-500">Actualiza el registro de recargas</p>
            </div>
            <form onSubmit={handleUpdateRecharge} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo inicial</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo final</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="closing_balance"
                    value={formData.closing_balance}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia (opcional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="profit"
                    value={formData.profit}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Recharges;