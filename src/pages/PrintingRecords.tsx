// src/pages/PrintingRecords.tsx
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
  TrendingDown,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { usePrintingRecords } from '../hooks/usePrintingRecords';
import { PrintingRecord } from '../types/database';
import formatMoney from '../utils/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  
  // Nuevos estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "copies" | "prints">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<"date" | "copies" | "prints">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filteredRecords, setFilteredRecords] = useState<PrintingRecord[]>([]);

  // Efecto para aplicar filtros
  React.useEffect(() => {
    if (!loading) {
      let filtered = [...records];
      
      // Aplicar búsqueda (por fecha o ID)
      if (searchTerm) {
        filtered = filtered.filter(record => 
          record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.date.includes(searchTerm)
        );
      }
      
      // Aplicar filtro por tipo
      if (typeFilter !== "all") {
        if (typeFilter === "copies") {
          filtered = filtered.filter(record => record.copies > 0);
        } else if (typeFilter === "prints") {
          filtered = filtered.filter(record => record.prints > 0);
        }
      }
      
      // Aplicar filtro por fecha
      if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateFilter === "today") {
          filtered = filtered.filter(record => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === today.getTime();
          });
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          filtered = filtered.filter(record => new Date(record.date) >= weekAgo);
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(record => new Date(record.date) >= monthAgo);
        }
      }
      
      // Aplicar ordenamiento
      filtered.sort((a, b) => {
        if (sortField === "date") {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          // Para campos numéricos
          const valA = a[sortField];
          const valB = b[sortField];
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }
      });
      
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords([]);
    }
  }, [records, searchTerm, dateFilter, typeFilter, sortField, sortDirection, loading]);

 // Continúa desde la parte 1...

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  setFormData({
    ...formData,
    copies: '1',
    prints: '0'
  });
  setShowCopiesModal(true);
};

const openPrintsModal = () => {
  resetForm();
  setFormData({
    ...formData,
    copies: '0',
    prints: '1'
  });
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

const handleSort = (field: "date" | "copies" | "prints") => {
  if (field === sortField) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortDirection("desc");
  }
};

const resetFilters = () => {
  setSearchTerm("");
  setDateFilter("all");
  setTypeFilter("all");
  setSortField("date");
  setSortDirection("desc");
};

// Calcula las estadísticas generales
const calculateStats = () => {
  const totalCopies = filteredRecords.reduce((sum, record) => sum + record.copies, 0);
  const totalPrints = filteredRecords.reduce((sum, record) => sum + record.prints, 0);
  const totalDamaged = filteredRecords.reduce((sum, record) => sum + record.damaged_sheets, 0);
  const totalSheets = totalCopies + totalPrints + totalDamaged;
  
  let totalIncome = 0;
  let totalCost = 0;
  
  filteredRecords.forEach(record => {
    const { totalIncome: income, totalCost: cost } = calculateTotals(record);
    totalIncome += income;
    totalCost += cost;
  });
  
  const profit = totalIncome - totalCost;
  
  return {
    totalCopies,
    totalPrints,
    totalDamaged,
    totalSheets,
    totalIncome,
    totalCost,
    profit,
    isProfitable: profit >= 0
  };
};

const stats = calculateStats();

// Componente para mostrar un registro individual con más información
const RecordItem = ({ record }: { record: PrintingRecord }) => {
  const [expanded, setExpanded] = useState(false);
  const { totalSheets, totalCost, copyIncome, printIncome, totalIncome, profit, isProfitable } = calculateTotals(record);
  
  const isOnlyCopies = record.copies > 0 && record.prints === 0;
  const isOnlyPrints = record.prints > 0 && record.copies === 0;
  const isMixed = record.copies > 0 && record.prints > 0;
  
  // Determinar el color de fondo según el tipo de registro
  const bgColorClass = isOnlyCopies 
    ? "bg-green-50 border-green-200" 
    : isOnlyPrints 
      ? "bg-blue-50 border-blue-200" 
      : "bg-purple-50 border-purple-200";
      
  const iconClass = isOnlyCopies 
    ? "text-green-600" 
    : isOnlyPrints 
      ? "text-blue-600" 
      : "text-purple-600";

  const iconBgClass = isOnlyCopies 
    ? "bg-green-100" 
    : isOnlyPrints 
      ? "bg-blue-100" 
      : "bg-purple-100";

  return (
    <div className={`rounded-lg border ${bgColorClass} overflow-hidden transition-all duration-200`}>
      {/* Cabecera del registro */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className={`p-2.5 mr-3 rounded-full ${iconBgClass}`}>
              {isOnlyCopies ? (
                <Copy className={`h-5 w-5 ${iconClass}`} />
              ) : isOnlyPrints ? (
                <FileText className={`h-5 w-5 ${iconClass}`} />
              ) : (
                <Printer className={`h-5 w-5 ${iconClass}`} />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium text-lg">
                  {isOnlyCopies ? "Registro de copias" : isOnlyPrints ? "Registro de impresiones" : "Registro mixto"}
                </h3>
                <span 
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full 
                    ${isProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {isProfitable ? 'Ganancia' : 'Pérdida'}
                </span>
              </div>
              <div className="flex text-xs text-gray-500 mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {format(new Date(record.date), "dd 'de' MMMM, yyyy", { locale: es })}
                </span>
                <span className="mx-1">•</span>
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  {format(new Date(record.created_at), "HH:mm")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-sm px-3 py-1 rounded-md border transition-colors
                ${expanded 
                  ? "bg-gray-100 text-gray-700 border-gray-300" 
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            >
              {expanded ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
            <div className="flex space-x-1">
              <button
                onClick={() => openEditModal(record)}
                className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
                title="Editar registro"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDeleteRecord(record.id)}
                className="p-1.5 rounded text-red-600 hover:bg-red-50"
                title="Eliminar registro"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Información básica siempre visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
          {record.copies > 0 && (
            <div className="bg-white p-2 rounded-lg border border-gray-200">
              <div className="text-gray-500 mb-1 flex items-center">
                <Copy className="h-3.5 w-3.5 mr-1 text-green-500" />
                <span>Copias:</span>
              </div>
              <div className="font-medium">{record.copies} unidades</div>
            </div>
          )}
          
          {record.prints > 0 && (
            <div className="bg-white p-2 rounded-lg border border-gray-200">
              <div className="text-gray-500 mb-1 flex items-center">
                <FileText className="h-3.5 w-3.5 mr-1 text-blue-500" />
                <span>Impresiones:</span>
              </div>
              <div className="font-medium">{record.prints} unidades</div>
            </div>
          )}
          
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <div className="text-gray-500 mb-1 flex items-center">
              <DollarSign className="h-3.5 w-3.5 mr-1 text-gray-500" />
              <span>Ingresos:</span>
            </div>
            <div className="font-medium">{formatMoney(totalIncome)}</div>
          </div>
          
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <div className="text-gray-500 mb-1 flex items-center">
              {isProfitable ? (
                <TrendingUp className="h-3.5 w-3.5 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 mr-1 text-red-500" />
              )}
              <span>{isProfitable ? "Ganancia:" : "Pérdida:"}</span>
            </div>
            <div className={`font-medium ${isProfitable ? "text-green-600" : "text-red-600"}`}>
              {formatMoney(Math.abs(profit))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Información detallada expandible */}
      {expanded && (
        <div className="border-t border-gray-200 bg-white p-4 transition-all duration-300">
          <h4 className="font-medium text-sm text-gray-700 mb-3">Detalles del registro</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Total hojas utilizadas</p>
                <p className="font-medium">{totalSheets} hojas</p>
                <div className="text-xs text-gray-500 mt-1">
                  <span>Incluye {record.damaged_sheets} {record.damaged_sheets === 1 ? 'hoja dañada' : 'hojas dañadas'}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Precios</p>
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between">
                    <span className="text-xs">Costo por hoja:</span>
                    <span className="text-xs font-medium">{formatMoney(record.cost_per_sheet)}</span>
                  </div>
                  {record.copies > 0 && record.price_per_copy && (
                    <div className="flex justify-between">
                      <span className="text-xs">Precio por copia:</span>
                      <span className="text-xs font-medium">{formatMoney(record.price_per_copy)}</span>
                    </div>
                  )}
                  {record.prints > 0 && record.price_per_print && (
                    <div className="flex justify-between">
                      <span className="text-xs">Precio por impresión:</span>
                      <span className="text-xs font-medium">{formatMoney(record.price_per_print)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Desglose financiero</p>
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between">
                    <span className="text-xs">Costo total:</span>
                    <span className="text-xs font-medium text-red-600">{formatMoney(totalCost)}</span>
                  </div>
                  {record.copies > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs">Ingreso por copias:</span>
                      <span className="text-xs font-medium text-green-600">{formatMoney(copyIncome)}</span>
                    </div>
                  )}
                  {record.prints > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs">Ingreso por impresiones:</span>
                      <span className="text-xs font-medium text-green-600">{formatMoney(printIncome)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-gray-200">
                    <span className="text-xs font-medium">Balance final:</span>
                    <span className={`text-xs font-medium ${isProfitable ? "text-green-600" : "text-red-600"}`}>
                      {formatMoney(profit)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Rendimiento</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${isProfitable ? 'bg-green-600' : 'bg-red-600'}`}
                    style={{ width: `${Math.min(100, Math.abs((profit / totalCost) * 100))}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-1">
                  {isProfitable 
                    ? `Margen de ganancia: ${((profit / totalIncome) * 100).toFixed(1)}%`
                    : `Pérdida: ${Math.abs((profit / totalCost) * 100).toFixed(1)}% del costo`}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Eficiencia</p>
                <div className="mt-1 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs">Tasa de desperdicio:</span>
                    <span className="text-xs font-medium">
                      {record.damaged_sheets > 0 
                        ? `${((record.damaged_sheets / totalSheets) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Hojas efectivas:</span>
                    <span className="text-xs font-medium">
                      {(totalSheets - record.damaged_sheets)} ({((totalSheets - record.damaged_sheets) / totalSheets * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Ganancia por hoja:</span>
                    <span className={`text-xs font-medium ${isProfitable ? "text-green-600" : "text-red-600"}`}>
                      {formatMoney(profit / (totalSheets - record.damaged_sheets))}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Información adicional</p>
                <div className="mt-1 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>ID de registro:</span>
                    <span className="font-mono">{record.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creado el:</span>
                    <span>{format(new Date(record.created_at), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// Continúa desde la parte 2...

return (
  <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
      <div className="flex items-center space-x-4">
        <Printer className="text-blue-600 w-10 h-10" />
        <h1 className="text-3xl font-bold text-gray-900">Registro de Impresiones</h1>
      </div>
      <div className="flex space-x-3">
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

    {/* Tarjetas de estadísticas */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Total Copias</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCopies}</p>
          </div>
          <div className="p-2 bg-green-100 rounded-full">
            <Copy className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Total Impresiones</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPrints}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-full">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Total Ingresos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(stats.totalIncome)}</p>
          </div>
          <div className="p-2 bg-purple-100 rounded-full">
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">
              {stats.isProfitable ? "Ganancia Total" : "Pérdida Total"}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(Math.abs(stats.profit))}</p>
          </div>
          <div className={`p-2 ${stats.isProfitable ? "bg-green-100" : "bg-red-100"} rounded-full`}>
            {stats.isProfitable ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Sección principal con filtros y lista */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Filter size={16} className="text-gray-400" />
              <span>Filtros</span>
              {showFilters ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="copies">Solo copias</option>
                <option value="prints">Solo impresiones</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <X size={16} className="mr-1" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de registros */}
      <div className="p-4">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Cargando registros...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <div className="p-4 bg-gray-100 rounded-full inline-flex">
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchTerm || typeFilter !== "all" || dateFilter !== "all" 
                ? "No se encontraron registros con esos filtros" 
                : "No hay registros de impresión"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              {searchTerm || typeFilter !== "all" || dateFilter !== "all"
                ? "Intenta con otros filtros o crea un nuevo registro."
                : "Los registros de impresión y fotocopias aparecerán aquí."}
            </p>
            {(searchTerm || typeFilter !== "all" || dateFilter !== "all") && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Ordenar por */}
            <div className="mb-4 flex items-center text-sm">
              <span className="text-gray-600 mr-2">Ordenar por:</span>
              <button
                onClick={() => handleSort("date")}
                className={`px-3 py-1 rounded-md mr-2 flex items-center ${
                  sortField === "date" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                Fecha
                {sortField === "date" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSort("copies")}
                className={`px-3 py-1 rounded-md mr-2 flex items-center ${
                  sortField === "copies" ? "bg-green-100 text-green-700" : "hover:bg-gray-100"
                }`}
              >
                Copias
                {sortField === "copies" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSort("prints")}
                className={`px-3 py-1 rounded-md mr-2 flex items-center ${
                  sortField === "prints" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                Impresiones
                {sortField === "prints" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            </div>

            {/* Lista de registros individuales */}
            <div className="space-y-2">
              {filteredRecords.map((record) => (
                <RecordItem key={record.id} record={record} />
              ))}
            </div>
          </div>
        )}
      </div>

      {!loading && filteredRecords.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Mostrando {filteredRecords.length} de {records.length} registros
            </p>
            {(searchTerm || typeFilter !== "all" || dateFilter !== "all") && (
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <X size={14} className="mr-1" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Modal para agregar registro */}
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
                <Printer className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Agregar Registro</h3>
            </div>
            <p className="text-sm text-gray-500">Completa los detalles del registro</p>
          </div>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Copia</label>
                <input
                  type="number"
                  name="price_per_copy"
                  value={formData.price_per_copy}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Impresión</label>
                <input
                  type="number"
                  name="price_per_print"
                  value={formData.price_per_print}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Hoja</label>
                <input
                  type="number"
                  name="cost_per_sheet"
                  value={formData.cost_per_sheet}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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

    {/* Modal para copias */}
    {showCopiesModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowCopiesModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-1">
              <div className="p-2 bg-green-100 rounded-lg">
                <Copy className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Registrar Copias</h3>
            </div>
            <p className="text-sm text-gray-500">Registra las fotocopias realizadas</p>
          </div>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Copias</label>
              <input
                type="number"
                name="copies"
                value={formData.copies}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Copia</label>
              <input
                type="number"
                name="price_per_copy"
                value={formData.price_per_copy}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hojas Dañadas</label>
              <input
                type="number"
                name="damaged_sheets"
                value={formData.damaged_sheets}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Hoja</label>
              <input
                type="number"
                name="cost_per_sheet"
                value={formData.cost_per_sheet}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
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

    {/* Modal para impresiones */}
    {showPrintsModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowPrintsModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Registrar Impresiones</h3>
            </div>
            <p className="text-sm text-gray-500">Registra las impresiones realizadas</p>
          </div>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Impresiones</label>
              <input
                type="number"
                name="prints"
                value={formData.prints}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Impresión</label>
              <input
                type="number"
                name="price_per_print"
                value={formData.price_per_print}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hojas Dañadas</label>
              <input
                type="number"
                name="damaged_sheets"
                value={formData.damaged_sheets}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Hoja</label>
              <input
                type="number"
                name="cost_per_sheet"
                value={formData.cost_per_sheet}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

    {/* Modal para editar registro */}
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
                <Pencil className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Editar Registro</h3>
            </div>
            <p className="text-sm text-gray-500">Actualiza los detalles del registro</p>
          </div>
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Copia</label>
                <input
                  type="number"
                  name="price_per_copy"
                  value={formData.price_per_copy}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Impresión</label>
                <input
                  type="number"
                  name="price_per_print"
                  value={formData.price_per_print}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Hoja</label>
                <input
                  type="number"
                  name="cost_per_sheet"
                  value={formData.cost_per_sheet}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                />
              </div>
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
                className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700"
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