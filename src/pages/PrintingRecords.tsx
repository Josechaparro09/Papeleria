import React, { useState } from 'react';
import { Printer, Plus, AlertCircle, Pencil, Trash2, X, Calendar } from 'lucide-react';
import { usePrintingRecords } from '../hooks/usePrintingRecords';
import { PrintingRecord } from '../types/database';
import { format } from 'date-fns';

function PrintingRecords() {
  const { records, loading, addRecord, updateRecord, deleteRecord } = usePrintingRecords();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PrintingRecord | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    copies: '',
    prints: '',
    damaged_sheets: '',
    cost_per_sheet: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      copies: '',
      prints: '',
      damaged_sheets: '',
      cost_per_sheet: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (record: PrintingRecord) => {
    setCurrentRecord(record);
    setFormData({
      date: format(new Date(record.date), 'yyyy-MM-dd'),
      copies: record.copies.toString(),
      prints: record.prints.toString(),
      damaged_sheets: record.damaged_sheets.toString(),
      cost_per_sheet: record.cost_per_sheet.toString()
    });
    setShowEditModal(true);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRecord({
        date: formData.date,
        copies: parseInt(formData.copies),
        prints: parseInt(formData.prints),
        damaged_sheets: parseInt(formData.damaged_sheets),
        cost_per_sheet: parseFloat(formData.cost_per_sheet),
        updated_at: new Date().toISOString()
      });
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;
    
    try {
      await updateRecord(currentRecord.id, {
        date: formData.date,
        copies: parseInt(formData.copies),
        prints: parseInt(formData.prints),
        damaged_sheets: parseInt(formData.damaged_sheets),
        cost_per_sheet: parseFloat(formData.cost_per_sheet)
      });
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  // Calculate totals for a record
  const calculateTotals = (record: PrintingRecord) => {
    const totalSheets = record.copies + record.prints + record.damaged_sheets;
    const totalCost = totalSheets * record.cost_per_sheet;
    return { totalSheets, totalCost };
  };

  // Group records by month
  const groupedRecords: { [key: string]: PrintingRecord[] } = {};
  records.forEach(record => {
    const month = record.date.substring(0, 7); // Format: YYYY-MM
    if (!groupedRecords[month]) {
      groupedRecords[month] = [];
    }
    groupedRecords[month].push(record);
  });

  // Sort months in descending order
  const sortedMonths = Object.keys(groupedRecords).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Printer className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Registro de Impresiones</h1>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nuevo registro</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-6 text-center">Cargando registros...</div>
        ) : records.length === 0 ? (
          <div className="p-6">
            <div className="flex items-center justify-center text-gray-500 py-8">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros de impresión</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Los registros de impresión y fotocopias aparecerán aquí
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            {sortedMonths.map(month => {
              // Calculate month totals
              const monthlyRecords = groupedRecords[month];
              const monthlyCopies = monthlyRecords.reduce((sum, record) => sum + record.copies, 0);
              const monthlyPrints = monthlyRecords.reduce((sum, record) => sum + record.prints, 0);
              const monthlyDamaged = monthlyRecords.reduce((sum, record) => sum + record.damaged_sheets, 0);
              const monthlyTotalSheets = monthlyCopies + monthlyPrints + monthlyDamaged;
              const monthlyCost = monthlyRecords.reduce((sum, record) => {
                const { totalCost } = calculateTotals(record);
                return sum + totalCost;
              }, 0);

              return (
                <div key={month} className="mb-6 last:mb-0">
                  <div className="bg-gray-50 px-6 py-4 border-t border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-700">
                        {format(new Date(`${month}-01`), 'MMMM yyyy')}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {monthlyRecords.length} registros
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Copias:</span>
                        <span className="ml-1 font-medium">{monthlyCopies}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Impresiones:</span>
                        <span className="ml-1 font-medium">{monthlyPrints}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Hojas dañadas:</span>
                        <span className="ml-1 font-medium">{monthlyDamaged}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total hojas:</span>
                        <span className="ml-1 font-medium">{monthlyTotalSheets}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Costo total:</span>
                        <span className="ml-1 font-medium">${monthlyCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Copias
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Impresiones
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hojas dañadas
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total hojas
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo/hoja
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo total
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {monthlyRecords.map((record) => {
                          const { totalSheets, totalCost } = calculateTotals(record);
                          return (
                            <tr key={record.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(record.date), 'dd/MM/yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {record.copies}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {record.prints}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {record.damaged_sheets}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {totalSheets}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ${record.cost_per_sheet.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                ${totalCost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => openEditModal(record)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Pencil size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Nuevo Registro de Impresión</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRecord}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Copias</label>
                  <input
                    type="number"
                    name="copies"
                    value={formData.copies}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impresiones</label>
                  <input
                    type="number"
                    name="prints"
                    value={formData.prints}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hojas dañadas</label>
                  <input
                    type="number"
                    name="damaged_sheets"
                    value={formData.damaged_sheets}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo por hoja</label>
                  <input
                    type="number"
                    name="cost_per_sheet"
                    value={formData.cost_per_sheet}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Editar Registro de Impresión</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateRecord}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Copias</label>
                  <input
                    type="number"
                    name="copies"
                    value={formData.copies}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impresiones</label>
                  <input
                    type="number"
                    name="prints"
                    value={formData.prints}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hojas dañadas</label>
                  <input
                    type="number"
                    name="damaged_sheets"
                    value={formData.damaged_sheets}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo por hoja</label>
                  <input
                    type="number"
                    name="cost_per_sheet"
                    value={formData.cost_per_sheet}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
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

export default PrintingRecords;