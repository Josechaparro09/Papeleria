import React, { useState, useMemo } from 'react';
import { Printer, Pencil, Trash2, X, Copy, FileText, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { usePrintingRecords } from '../hooks/usePrintingRecords';
import { PrintingRecord } from '../types/database';
import formatMoney from '../utils/format';
import { getTodayISO, formatDateColombia, normalizeToISODate } from '../utils/dateHelper';

function PrintingRecords() {
  const { records, loading, addRecord, updateRecord, deleteRecord } = usePrintingRecords();
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PrintingRecord | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: getTodayISO(),
    endDate: getTodayISO()
  });
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [formData, setFormData] = useState({
    date: getTodayISO(),
    copies: '0',
    prints: '0',
    damaged_sheets: '0',
    cost_per_sheet: '',
    price_per_copy: '',
    price_per_print: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.date.includes(searchTerm) || 
                         record.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (!dateRange.startDate || !dateRange.endDate) return true;

    if (isRangeMode) {
      return record.date >= dateRange.startDate && record.date <= dateRange.endDate;
    } else {
      return record.date === dateRange.startDate;
    }
  });

  const dateTotals = useMemo(() => {
    return filteredRecords.reduce((acc, record) => ({
      copies: acc.copies + record.copies,
      prints: acc.prints + record.prints,
      damaged: acc.damaged + record.damaged_sheets,
      total: acc.total + record.copies + record.prints + record.damaged_sheets
    }), { copies: 0, prints: 0, damaged: 0, total: 0 });
  }, [filteredRecords]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      date: getTodayISO(),
      copies: '0',
      prints: '0',
      damaged_sheets: '0',
      cost_per_sheet: '',
      price_per_copy: '',
      price_per_print: '',
    });
  };

  const openAddModal = (type: 'copies' | 'prints') => {
    resetForm();
    setFormData({
      ...formData,
      copies: type === 'copies' ? '1' : '0',
      prints: type === 'prints' ? '1' : '0',
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (record: PrintingRecord) => {
    setCurrentRecord(record);
    setFormData({
      date: normalizeToISODate(record.date),
      copies: record.copies.toString(),
      prints: record.prints.toString(),
      damaged_sheets: record.damaged_sheets.toString(),
      cost_per_sheet: record.cost_per_sheet.toString(),
      price_per_copy: record.price_per_copy?.toString() || '',
      price_per_print: record.price_per_print?.toString() || '',
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const calculateTotals = (record: PrintingRecord) => {
    const totalSheets = record.copies + record.prints + record.damaged_sheets;
    const totalCost = totalSheets * record.cost_per_sheet;
    const copyIncome = (record.price_per_copy || 0) * record.copies;
    const printIncome = (record.price_per_print || 0) * record.prints;
    const totalIncome = copyIncome + printIncome;
    const profit = totalIncome - totalCost;
    return { totalSheets, totalCost, copyIncome, printIncome, totalIncome, profit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date: formData.date,
      copies: parseInt(formData.copies) || 0,
      prints: parseInt(formData.prints) || 0,
      damaged_sheets: parseInt(formData.damaged_sheets) || 0,
      cost_per_sheet: parseFloat(formData.cost_per_sheet) || 0,
      price_per_copy: formData.price_per_copy ? parseFloat(formData.price_per_copy) : undefined,
      price_per_print: formData.price_per_print ? parseFloat(formData.price_per_print) : undefined,
    };
    try {
      if (isEditMode && currentRecord) {
        await updateRecord(currentRecord.id, data);
      } else {
        await addRecord(data);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      await deleteRecord(id);
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
            <Printer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Registros de Impresión</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openAddModal('copies')}
            className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 flex items-center"
          >
            <Copy className="mr-2" size={18} /> Copias
          </button>
          <button
            onClick={() => openAddModal('prints')}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 flex items-center"
          >
            <FileText className="mr-2" size={18} /> Impresiones
          </button>
        </div>
      </div>

      {/* Filtros y Resumen */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Filtrar por fecha
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setIsRangeMode(false);
                    setDateRange({
                      startDate: getTodayISO(),
                      endDate: getTodayISO()
                    });
                  }}
                  className={`text-sm px-2 py-1 rounded ${!isRangeMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Día específico
                </button>
                <button
                  onClick={() => setIsRangeMode(true)}
                  className={`text-sm px-2 py-1 rounded ${isRangeMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Rango
                </button>
              </div>
            </div>

            {isRangeMode ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha inicial
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    max={dateRange.endDate}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha final
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    min={dateRange.startDate}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="date"
                  id="singleDate"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ startDate: e.target.value, endDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const today = getTodayISO();
                  setDateRange({ startDate: today, endDate: today });
                  setIsRangeMode(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Hoy
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setIsRangeMode(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver todos
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de hojas */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {isRangeMode ? (
              dateRange.startDate && dateRange.endDate ? 
                `Resumen del ${formatDateColombia(dateRange.startDate, "PPP")} al ${formatDateColombia(dateRange.endDate, "PPP")}` :
                'Resumen total'
            ) : (
              dateRange.startDate ? 
                `Resumen del ${formatDateColombia(dateRange.startDate, "PPP")}` :
                'Resumen total'
            )}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Copias:</span>
                <p className="text-2xl font-bold text-green-600">{dateTotals.copies}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Impresiones:</span>
                <p className="text-2xl font-bold text-blue-600">{dateTotals.prints}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Hojas dañadas:</span>
                <p className="text-2xl font-bold text-red-600">{dateTotals.damaged}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total hojas:</span>
                <p className="text-2xl font-bold text-gray-900">{dateTotals.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por fecha o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-xl bg-white shadow-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-6 text-center text-gray-600 bg-white rounded-xl shadow-md">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 font-medium">Cargando...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-600 bg-white rounded-xl shadow-md">
            <p className="font-medium">No hay registros disponibles</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const { totalSheets, totalCost, copyIncome, printIncome, totalIncome, profit } = calculateTotals(record);
            const isExpanded = expandedRecordId === record.id;
            const recordType = record.copies > 0 && record.prints > 0 ? 'Mixto' : record.copies > 0 ? 'Copias' : 'Impresiones';
            const bgColor = record.copies > 0 && record.prints > 0 
              ? 'bg-gradient-to-r from-purple-50 to-purple-100' 
              : record.copies > 0 
                ? 'bg-gradient-to-r from-green-50 to-green-100' 
                : 'bg-gradient-to-r from-blue-50 to-blue-100';
            const iconColor = record.copies > 0 && record.prints > 0 ? 'text-purple-600' : record.copies > 0 ? 'text-green-600' : 'text-blue-600';
            const saleTime = formatDateColombia(record.created_at, 'HH:mm');

            return (
              <div key={record.id} className={`rounded-xl shadow-md overflow-hidden ${bgColor} transition-all duration-300 hover:shadow-lg`}>
                {/* Summary Row */}
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleDetails(record.id)}
                        className="mr-3 p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 focus:outline-none"
                      >
                        {isExpanded ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
                      </button>
                      <div className="flex items-center space-x-2">
                        <span className={`p-2 rounded-full bg-white shadow-sm ${iconColor}`}>
                          {recordType === 'Copias' ? <Copy size={18} /> : recordType === 'Impresiones' ? <FileText size={18} /> : <Printer size={18} />}
                        </span>
                        <p className="text-lg font-semibold text-gray-800">{recordType}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 ml-10">
                      {formatDateColombia(record.date, "dd 'de' MMMM, yyyy")} • <span className="font-medium text-blue-600">{saleTime}</span> • <span className="font-medium">{totalSheets}</span> hojas
                    </p>
                    <p className="text-sm text-gray-600 ml-10 mt-1">
                      Copias: <span className="font-medium">{record.copies}</span> | Impresiones: <span className="font-medium">{record.prints}</span> | Dañadas: <span className="font-medium">{record.damaged_sheets}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-3 md:mt-0">
                    <p className={`text-sm font-semibold px-3 py-1 rounded-full shadow-sm ${profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} transition-all duration-200`}>
                      {profit >= 0 ? 'Ganancia' : 'Pérdida'}: {formatMoney(Math.abs(profit))}
                    </p>
                    <button
                      onClick={() => openEditModal(record)}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200 shadow-sm"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 text-red-600 hover:bg-red-200 rounded-full transition-colors duration-200 shadow-sm"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Details Section (Expandable) */}
                {isExpanded && (
                  <div className="p-5 bg-white border-t border-gray-200 transition-all duration-300 ease-in-out">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Detalles del Registro</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p><span className="text-gray-500 font-medium">Hora de venta:</span> <span className="text-blue-600 font-medium">{saleTime}</span></p>
                        <p><span className="text-gray-500 font-medium">Costo por hoja:</span> {formatMoney(record.cost_per_sheet)}</p>
                        {record.copies > 0 && record.price_per_copy && (
                          <p><span className="text-gray-500 font-medium">Precio por copia:</span> {formatMoney(record.price_per_copy)}</p>
                        )}
                        {record.prints > 0 && record.price_per_print && (
                          <p><span className="text-gray-500 font-medium">Precio por impresión:</span> {formatMoney(record.price_per_print)}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p><span className="text-gray-500 font-medium">Ingreso copias:</span> {formatMoney(copyIncome)}</p>
                        <p><span className="text-gray-500 font-medium">Ingreso impresiones:</span> {formatMoney(printIncome)}</p>
                        <p><span className="text-gray-500 font-medium">Total ingresos:</span> {formatMoney(totalIncome)}</p>
                        <p><span className="text-gray-500 font-medium">Costo total:</span> {formatMoney(totalCost)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">ID: {record.id}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl transition-all duration-300 transform scale-95 hover:scale-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-6 tracking-tight">
              {isEditMode ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Copias</label>
                  <input
                    type="number"
                    name="copies"
                    value={formData.copies}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Copia</label>
                  <input
                    type="number"
                    name="price_per_copy"
                    value={formData.price_per_copy}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impresiones</label>
                  <input
                    type="number"
                    name="prints"
                    value={formData.prints}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Impresión</label>
                  <input
                    type="number"
                    name="price_per_print"
                    value={formData.price_per_print}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hojas Dañadas</label>
                  <input
                    type="number"
                    name="damaged_sheets"
                    value={formData.damaged_sheets}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Hoja</label>
                  <input
                    type="number"
                    name="cost_per_sheet"
                    value={formData.cost_per_sheet}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md transform hover:scale-105"
                >
                  {isEditMode ? 'Actualizar' : 'Guardar'}
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