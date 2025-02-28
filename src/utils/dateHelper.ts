// src/utils/dateHelper.ts
import { format as dateFnsFormat, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 * @returns La fecha actual en formato ISO
 */
export function getTodayISO(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Convierte una fecha en formato ISO a fecha local colombiana
 * Esta función es crucial para manejar las diferencias de zona horaria
 * @param isoDate Fecha en formato ISO YYYY-MM-DD
 * @returns Fecha local para Colombia sin desplazamiento por zona horaria
 */
export function toLocalDate(isoDate: string): Date {
  // Creamos una fecha a mediodía para evitar problemas con zonas horarias
  // Colombia está en UTC-5, así que aseguraremos que la fecha se interprete correctamente
  const date = new Date(`${isoDate}T12:00:00-05:00`);
  return date;
}

/**
 * Formatea una fecha a un formato específico, considerando la zona horaria de Colombia
 * @param date Fecha a formatear (string ISO o Date)
 * @param formatStr Formato deseado
 * @returns Fecha formateada según el formato especificado
 */
export function formatDateColombia(date: string | Date, formatStr: string): string {
  let dateObj: Date;

  if (typeof date === 'string') {
    // Si es una fecha ISO (YYYY-MM-DD), la convertimos a local
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateObj = toLocalDate(date);
    } else {
      // Si tiene otro formato, asumimos que ya tiene zona horaria
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  return dateFnsFormat(dateObj, formatStr, { locale: es });
}

/**
 * Compara si dos fechas corresponden al mismo día, ignorando la hora y
 * ajustando por zona horaria de Colombia (UTC-5)
 *
 * @param date1 Primera fecha (string ISO YYYY-MM-DD o Date)
 * @param date2 Segunda fecha (string ISO YYYY-MM-DD o Date)
 * @returns true si ambas fechas representan el mismo día
 */
export function isSameDayColombia(date1: string | Date, date2: string | Date): boolean {
  let dateObj1: Date;
  let dateObj2: Date;

  // Convertir primera fecha
  if (typeof date1 === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date1)) {
      dateObj1 = toLocalDate(date1);
    } else {
      dateObj1 = new Date(date1);
    }
  } else {
    dateObj1 = date1;
  }

  // Convertir segunda fecha
  if (typeof date2 === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date2)) {
      dateObj2 = toLocalDate(date2);
    } else {
      dateObj2 = new Date(date2);
    }
  } else {
    dateObj2 = date2;
  }

  // Comparar solo año, mes y día
  return (
    dateObj1.getFullYear() === dateObj2.getFullYear() &&
    dateObj1.getMonth() === dateObj2.getMonth() &&
    dateObj1.getDate() === dateObj2.getDate()
  );
}

/**
 * Normaliza una fecha a formato ISO YYYY-MM-DD
 * considerando la zona horaria de Colombia
 *
 * @param date Fecha a normalizar
 * @returns Fecha en formato ISO YYYY-MM-DD
 */
export function normalizeToISODate(date: string | Date): string {
  let dateObj: Date;

  if (typeof date === 'string') {
    // Si ya es ISO, la retornamos tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Si no es ISO, la convertimos a Date
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Convertir a formato ISO YYYY-MM-DD
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}
