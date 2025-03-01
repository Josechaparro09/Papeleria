// src/utils/printingUtils.ts
import { PrintingRecord } from '../types/database';
import { format } from 'date-fns';

/**
 * Calcula la ganancia de un registro de impresión individual
 * @param record Registro de impresión
 * @returns Ganancia calculada
 */
export const calculatePrintingProfit = (record: PrintingRecord): number => {
  // Calcular el total de hojas utilizadas
  const totalSheets = record.copies + record.prints + record.damaged_sheets;
  
  // Calcular el costo total
  const totalCost = totalSheets * record.cost_per_sheet;
  
  // Calcular los ingresos
  const copyIncome = (record.price_per_copy || 0) * record.copies;
  const printIncome = (record.price_per_print || 0) * record.prints;
  const totalIncome = copyIncome + printIncome;
  
  // Ganancia = ingresos - costos
  return totalIncome - totalCost;
};

/**
 * Calcula las ganancias de impresiones para un período específico
 * @param records Registros de impresión
 * @param fromDate Fecha de inicio (opcional)
 * @param toDate Fecha de fin (opcional)
 * @returns Ganancia total del período
 */
export const calculatePeriodPrintingProfits = (
  records: PrintingRecord[],
  fromDate?: string, 
  toDate?: string
): number => {
  // Filtrar por período si se especifica
  let filteredRecords = [...records];
  
  if (fromDate) {
    filteredRecords = filteredRecords.filter(record => record.date >= fromDate);
  }
  
  if (toDate) {
    filteredRecords = filteredRecords.filter(record => record.date <= toDate);
  }
  
  // Calcular ganancia total
  return filteredRecords.reduce((total, record) => {
    return total + calculatePrintingProfit(record);
  }, 0);
};

/**
 * Obtiene las ganancias de impresiones del día actual
 * @param records Todos los registros de impresión
 * @returns Ganancia del día actual
 */
export const getTodayPrintingProfits = (records: PrintingRecord[]): number => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return calculatePeriodPrintingProfits(
    records.filter(record => record.date === today)
  );
};

/**
 * Obtiene las ganancias de impresiones del mes actual
 * @param records Todos los registros de impresión
 * @returns Ganancia del mes actual
 */
export const getMonthlyPrintingProfits = (records: PrintingRecord[]): number => {
  const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const lastDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');
  
  return calculatePeriodPrintingProfits(
    records,
    firstDayOfMonth,
    lastDayOfMonth
  );
};

/**
 * Genera un resumen de ganancias de impresiones por día, mes o año
 * @param records Registros de impresión
 * @param groupBy Tipo de agrupación ('day', 'month', 'year')
 * @returns Objeto con las ganancias agrupadas
 */
export const getPrintingProfitsSummary = (
  records: PrintingRecord[],
  groupBy: 'day' | 'month' | 'year' = 'day'
): Record<string, number> => {
  const summary: Record<string, number> = {};
  
  records.forEach(record => {
    let groupKey: string;
    const date = new Date(record.date);
    
    // Determinar la clave de agrupación
    if (groupBy === 'day') {
      groupKey = format(date, 'yyyy-MM-dd');
    } else if (groupBy === 'month') {
      groupKey = format(date, 'yyyy-MM');
    } else {
      groupKey = format(date, 'yyyy');
    }
    
    // Calcular ganancia del registro
    const profit = calculatePrintingProfit(record);
    
    // Agregar a la suma del período
    if (!summary[groupKey]) {
      summary[groupKey] = 0;
    }
    summary[groupKey] += profit;
  });
  
  return summary;
};