// src/components/DateFilter.tsx
import React, { useState } from 'react';
import { Calendar, ChevronDown, Download, Filter, X } from 'lucide-react';
import { formatDateColombia } from '../utils/dateHelper';

interface DateFilterProps {
  onDateChange: (date: string | null) => void;
  onExportDate: (date: string) => void;
  selectedDate: string | null;
}

const DateFilter: React.FC<DateFilterProps> = ({ onDateChange, onExportDate, selectedDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputDate, setInputDate] = useState(selectedDate || '');

  const handleDateSelect = () => {
    if (inputDate) {
      // Asegurarse de que estamos pasando solo la parte de fecha YYYY-MM-DD
      // sin ajustes de zona horaria
      const dateOnly = inputDate.split('T')[0];
      onDateChange(dateOnly);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputDate('');
    onDateChange(null);
  };

  const handleExport = () => {
    if (selectedDate) {
      onExportDate(selectedDate);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
        >
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-700">
            {selectedDate 
              ? `Filtrado: ${formatDateColombia(selectedDate, "d 'de' MMMM, yyyy")}` 
              : "Filtrar por fecha"}
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>
        
        {selectedDate && (
          <button
            onClick={handleClear}
            className="p-2 rounded-full hover:bg-red-50 text-red-500"
            title="Limpiar filtro"
          >
            <X size={16} />
          </button>
        )}
        
        {selectedDate && (
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Exportar día seleccionado"
          >
            <Download size={16} />
            <span className="text-sm">Exportar día</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-72">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona una fecha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona la fecha para filtrar (zona horaria: Colombia UTC-5)
              </p>
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
                onClick={handleDateSelect}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                disabled={!inputDate}
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

export default DateFilter;