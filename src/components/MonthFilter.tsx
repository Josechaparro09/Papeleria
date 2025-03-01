// src/components/MonthFilter.tsx
import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthFilterProps {
  onMonthChange: (startDate: string, endDate: string, label: string) => void;
  onReset: () => void;
  currentMonth: { startDate: string; endDate: string; label: string } | null;
}

const MonthFilter: React.FC<MonthFilterProps> = ({ onMonthChange, onReset, currentMonth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Generar opciones de meses (últimos 12 meses)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy', { locale: es });
      options.push({ value, label });
    }
    
    return options;
  };
  
  const monthOptions = generateMonthOptions();
  
  const handleSelectMonth = () => {
    if (!selectedMonth) return;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd');
    const label = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: es });
    
    onMonthChange(startDate, endDate, label);
    setIsOpen(false);
  };
  
  const handleClearFilter = () => {
    onReset();
    setSelectedMonth('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
      >
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm text-gray-700">
          {currentMonth ? `Mes: ${currentMonth.label}` : "Filtrar por mes"}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>
      
      {currentMonth && (
        <button
          onClick={handleClearFilter}
          className="ml-2 p-2 rounded-full hover:bg-red-50 text-red-500"
          title="Limpiar filtro de mes"
        >
          <X size={16} />
        </button>
      )}
      
      {isOpen && (
        <div className="absolute mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-64">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona un mes</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar mes</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSelectMonth}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                disabled={!selectedMonth}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthFilter;