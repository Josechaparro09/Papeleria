// src/components/PrintingExportButton.tsx
import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { exportPrintingRecordsToExcel, exportPrintingProfitSummaryToExcel } from '../utils/excelExport';
import { PrintingRecord } from '../types/database';

interface PrintingExportButtonProps {
  records: PrintingRecord[];
  className?: string;
}

const PrintingExportButton: React.FC<PrintingExportButtonProps> = ({ records, className = '' }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const handleExportDetailed = async () => {
    try {
      setExporting(true);
      await exportPrintingRecordsToExcel(records);
      setShowMenu(false);
    } catch (error) {
      console.error('Error al exportar registros detallados:', error);
    } finally {
      setExporting(false);
    }
  };
  
  const handleExportSummary = async () => {
    try {
      setExporting(true);
      await exportPrintingProfitSummaryToExcel(records);
      setShowMenu(false);
    } catch (error) {
      console.error('Error al exportar resumen mensual:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm ${className} ${exporting ? 'opacity-70 cursor-wait' : ''}`}
        disabled={exporting}
      >
        <Download size={18} />
        <span>Exportar</span>
        <ChevronDown size={16} />
      </button>
      
      {showMenu && (
        <>
          {/* Overlay para cerrar el menú al hacer clic fuera */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          ></div>
          
          {/* Menú desplegable */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-20">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="font-medium text-gray-700">Opciones de exportación</span>
              <button 
                onClick={() => setShowMenu(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="py-2">
              <button
                onClick={handleExportDetailed}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                disabled={exporting}
              >
                <FileSpreadsheet size={18} className="text-green-600" />
                <div className="flex-1">
                  <div className="text-sm text-gray-700">Registros detallados</div>
                  <div className="text-xs text-gray-500">Exporta todos los registros individuales</div>
                </div>
              </button>
              
              <button
                onClick={handleExportSummary}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                disabled={exporting}
              >
                <Calendar size={18} className="text-blue-600" />
                <div className="flex-1">
                  <div className="text-sm text-gray-700">Resumen mensual</div>
                  <div className="text-xs text-gray-500">Exporta un resumen agrupado por mes</div>
                </div>
              </button>
            </div>
            
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Exporta datos en formato Excel (.xlsx)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrintingExportButton;