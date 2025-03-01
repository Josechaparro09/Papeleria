// src/pages/RechargeHistory.tsx
import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  Eye,
  Lock,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { useRecharges } from '../hooks/useRecharges';
import formatMoney from '../utils/format';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, isWithinInterval } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { es } from 'date-fns/locale';

function RechargeHistory() {
  const { cashRegisters, loading, fetchTransactions } = useRecharges();
  const [selectedTransactions, setSelectedTransactions] = useState<
    { cashRegisterId: string; transactions: any[] } | null
  >(null);
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');

  const timeZone = 'America/Bogota'; // UTC-5

  const handleViewTransactions = async (cashRegisterId: string) => {
    try {
      const transactions = await fetchTransactions(cashRegisterId);
      setSelectedTransactions({ cashRegisterId, transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Filtrar cashRegisters según el período seleccionado
  const filteredCashRegisters = cashRegisters.filter((register) => {
    // Tratar register.date como una fecha local en UTC-5 directamente
    const registerDate = new Date(`${register.date}T00:00:00-05:00`); // Forzar UTC-5
    const today = toZonedTime(new Date(), timeZone);

    switch (filter) {
      case 'today':
        return isWithinInterval(registerDate, {
          start: startOfDay(today),
          end: endOfDay(today),
        });
      case 'week':
        return isWithinInterval(registerDate, {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfDay(today),
        });
      case 'month':
        return isWithinInterval(registerDate, {
          start: startOfMonth(today),
          end: endOfDay(today),
        });
      default:
        return true;
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Wallet className="mr-2 h-8 w-8 text-blue-600" />
          Historial de Cierres de Caja
        </h1>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'today' | 'week' | 'month')}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Hoy</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
          <span className="text-sm text-gray-500">
            {formatTz(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { timeZone, locale: es })}
          </span>
        </div>
      </div>

      {/* Lista de cierres */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Historial</h2>
        {loading ? (
          <div className="text-center py-4">
            <span className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="mt-2 text-gray-500">Cargando...</p>
          </div>
        ) : filteredCashRegisters.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay cierres registrados para este período</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-sm font-medium text-gray-600">Fecha</th>
                <th className="p-3 text-sm font-medium text-gray-600 text-right">Saldo Inicial</th>
                <th className="p-3 text-sm font-medium text-gray-600 text-right">Total Recargas</th>
                <th className="p-3 text-sm font-medium text-gray-600 text-right">Saldo Final</th>
                <th className="p-3 text-sm font-medium text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCashRegisters.map((register) => {
                const totalRecharges =
                  register.closing_balance !== undefined
                    ? register.opening_balance - register.closing_balance
                    : 0;
                const registerDate = new Date(`${register.date}T00:00:00-05:00`); // Forzar UTC-5
                return (
                  <tr key={register.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-800">
                      {formatTz(registerDate, "EEEE, d 'de' MMMM 'de' yyyy", { timeZone, locale: es })}
                    </td>
                    <td className="p-3 text-right text-gray-800">{formatMoney(register.opening_balance)}</td>
                    <td className="p-3 text-right text-red-600">{formatMoney(totalRecharges)}</td>
                    <td className="p-3 text-right text-green-600">
                      {register.closing_balance !== undefined
                        ? formatMoney(register.closing_balance)
                        : 'Caja abierta'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleViewTransactions(register.id)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                        title="Ver recargas"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de recargas */}
      {selectedTransactions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
              Recargas del Día
            </h2>
            {selectedTransactions.transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay recargas para este día</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-sm font-medium text-gray-600">Descripción</th>
                      <th className="p-3 text-sm font-medium text-gray-600 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTransactions.transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="p-3 text-gray-800">{t.description}</td>
                        <td className="p-3 text-right text-red-600">{formatMoney(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedTransactions(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RechargeHistory;