import React, { useState } from 'react';
import { 
  Printer, 
  Plus, 
  AlertCircle, 
  Pencil, 
  Trash2, 
  X, 
  Copy, 
  FileText, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { usePrintingRecords } from '../hooks/usePrintingRecords';
import { PrintingRecord } from '../types/database';
import formatMoney from '../utils/format';

// Helper function to format date
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1).toString().padStart(2, '0');
  const day = '' + d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();

  return [year, month, day].join('-');
};

function PrintingRecords() {
  const { records, loading, addRecord, updateRecord, deleteRecord } = usePrintingRecords();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCopiesModal, setShowCopiesModal] = useState(false);
  const [showPrintsModal, setShowPrintsModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PrintingRecord | null>(null);
  const [formData, setFormData] = useState({
    date: formatDate(new Date()),
    copies: '',
    prints: '',
    damaged_sheets: '',
    cost_per_sheet: '',
    price_per_copy: '',
    price_per_print: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      date: formatDate(new Date()),
      copies: '',
      prints: '',
      damaged_sheets: '',
      cost_per_sheet: '',
      price_per_copy: '',
      price_per_print: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (record: PrintingRecord) => {
    setCurrentRecord(record);
    setFormData({
      date: formatDate(record.date),
      copies: record.copies.toString(),
      prints: record.prints.toString(),
      damaged_sheets: record.damaged_sheets.toString(),
      cost_per_sheet: record.cost_per_sheet.toString(),
      price_per_copy: record.price_per_copy?.toString() || '',
      price_per_print: record.price_per_print?.toString() || ''
    });
    setShowEditModal(true);
  };

  const openCopiesModal = () => {
    resetForm();
    setShowCopiesModal(true);
  };

  const openPrintsModal = () => {
    resetForm();
    setShowPrintsModal(true);
  };

  const calculateTotals = (record: PrintingRecord) => {
    const totalSheets = record.copies + record.prints + record.damaged_sheets;
    const totalCost = totalSheets * record.cost_per_sheet;
    
    // Calculate income
    const copyIncome = (record.price_per_copy || 0) * record.copies;
    const printIncome = (record.price_per_print || 0) * record.prints;
    const totalIncome = copyIncome + printIncome;
    
    // Calculate profit or loss
    const profit = totalIncome - totalCost;
    
    return { 
      totalSheets, 
      totalCost, 
      copyIncome, 
      printIncome, 
      totalIncome, 
      profit,
      isProfitable: profit >= 0
    };
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRecord({
        date: formData.date,
        copies: parseInt(formData.copies || '0'),
        prints: parseInt(formData.prints || '0'),
        damaged_sheets: parseInt(formData.damaged_sheets || '0'),
        cost_per_sheet: parseFloat(formData.cost_per_sheet),
        price_per_copy: formData.price_per_copy ? parseFloat(formData.price_per_copy) : undefined,
        price_per_print: formData.price_per_print ? parseFloat(formData.price_per_print) : undefined
      });
      setShowAddModal(false);
      setShowCopiesModal(false);
      setShowPrintsModal(false);
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
        copies: parseInt(formData.copies || '0'),
        prints: parseInt(formData.prints || '0'),
        damaged_sheets: parseInt(formData.damaged_sheets || '0'),
        cost_per_sheet: parseFloat(formData.cost_per_sheet),
        price_per_copy: formData.price_per_copy ? parseFloat(formData.price_per_copy) : undefined,
        price_per_print: formData.price_per_print ? parseFloat(formData.price_per_print) : undefined
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <Printer className="text-blue-600 w-10 h-10" />
          <h1 className="text-3xl font-bold text-gray-900">Registro de Impresiones</h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={openCopiesModal}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Copy size={20} />
            <span>Registrar Copias</span>
          </button>
          <button
            onClick={openPrintsModal}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText size={20} />
            <span>Registrar Impresiones</span>
          </button>
        </div>
      </div>

      {/* Main Records Display */}
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
              
              // Monthly financial calculations
              let monthlyCost = 0;
              let monthlyIncome = 0;
              let monthlyProfit = 0;
              
              monthlyRecords.forEach(record => {
                const { totalCost, totalIncome, profit } = calculateTotals(record);
                monthlyCost += totalCost;
                monthlyIncome += totalIncome;
                monthlyProfit += profit;
              });
              
              const isProfitableMonth = monthlyProfit >= 0;

              // Format month for display (localized)
              const formattedMonth = new Date(`${month}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });

              return (
                <div key={month} className="mb-6 last:mb-0">
                  <div className="bg-gray-50 px-6 py-4 border-t border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-700">
                        {formattedMonth}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {monthlyRecords.length} registros
                      </div>
                    </div>
                    
                    {/* Monthly summary with profit/loss */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4 mt-4 text-sm">
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
                        <span className="text-gray-500">Costo:</span>
                        <span className="ml-1 font-medium">{formatMoney(monthlyCost)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ingresos:</span>
                        <span className="ml-1 font-medium">{formatMoney(monthlyIncome)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">
                          {isProfitableMonth ? "Ganancia:" : "Pérdida:"}
                        </span>
                        <span className={`font-medium flex items-center ${isProfitableMonth ? "text-green-600" : "text-red-600"}`}>
                          {formatMoney(Math.abs(monthlyProfit))}
                          {isProfitableMonth ? (
                            <TrendingUp size={16} className="ml-1" />
                          ) : (
                            <TrendingDown size={16} className="ml-1" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
{/* Copies Modal */}
{showCopiesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-50 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-green-800 flex items-center">
                  <Copy className="mr-2 text-green-600" />
                  Registrar Copias
                </h3>
                <button 
                  onClick={() => setShowCopiesModal(false)} 
                  className="text-green-600 hover:text-green-800"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Copias</label>
                <input
                  type="number"
                  name="copies"
                  value={formData.copies}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio por Copia</label>
                <input
                  type="number"
                  name="price_per_copy"
                  value={formData.price_per_copy}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hojas Dañadas</label>
                <input
                  type="number"
                  name="damaged_sheets"
                  value={formData.damaged_sheets}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Costo por Hoja</label>
                <input
                  type="number"
                  name="cost_per_sheet"
                  value={formData.cost_per_sheet}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCopiesModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Guardar Copias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prints Modal */}
      {showPrintsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-50 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-blue-800 flex items-center">
                  <FileText className="mr-2 text-blue-600" />
                  Registrar Impresiones
                </h3>
                <button 
                  onClick={() => setShowPrintsModal(false)} 
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Impresiones</label>
                <input
                  type="number"
                  name="prints"
                  value={formData.prints}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio por Impresión</label>
                <input
                  type="number"
                  name="price_per_print"
                  value={formData.price_per_print}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hojas Dañadas</label>
                <input
                  type="number"
                  name="damaged_sheets"
                  value={formData.damaged_sheets}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Costo por Hoja</label>
                <input
                  type="number"
                  name="cost_per_sheet"
                  value={formData.cost_per_sheet}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPrintsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Guardar Impresiones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-yellow-50 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-yellow-800 flex items-center">
                  <Pencil className="mr-2 text-yellow-600" />
                  Editar Registro
                </h3>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copias</label>
                <input
                  type="number"
                  name="copies"
                  value={formData.copies}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio por Copia</label>
                <input
                  type="number"
                  name="price_per_copy"
                  value={formData.price_per_copy}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Impresiones</label>
                <input
                  type="number"
                  name="prints"
                  value={formData.prints}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio por Impresión</label>
                <input
                  type="number"
                  name="price_per_print"
                  value={formData.price_per_print}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hojas Dañadas</label>
                <input
                  type="number"
                  name="damaged_sheets"
                  value={formData.damaged_sheets}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Costo por Hoja</label>
                <input
                  type="number"
                  name="cost_per_sheet"
                  value={formData.cost_per_sheet}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
                >
                  Actualizar Registro
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
      