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
 * @param dateStr Fecha en cualquier formato válido
 * @returns Fecha local para Colombia sin desplazamiento por zona horaria
 */
export function toLocalDate(dateStr: string): Date {
  try {
    // Verificar si la fecha ya incluye información de zona horaria
    if (dateStr.includes('T') || dateStr.includes(' ')) {
      // Si ya tiene formato completo con hora, simplemente la parseamos
      return new Date(dateStr);
    } else {
      // Si es solo YYYY-MM-DD, añadimos la hora y zona horaria de Colombia
      // Usamos 12:00:00 para evitar problemas con cambios de día debido a zonas horarias
      const colombiaDate = new Date(`${dateStr}T12:00:00-05:00`);
      
      // Crear una nueva fecha con los componentes de la fecha de Colombia
      // Esto evita problemas con la conversión de zona horaria
      const year = colombiaDate.getFullYear();
      const month = colombiaDate.getMonth();
      const day = colombiaDate.getDate();
      
      // Crear una nueva fecha con la hora a mediodía para evitar problemas con zonas horarias
      const localDate = new Date(year, month, day, 12, 0, 0);
      
      return localDate;
    }
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    // En caso de error, devolver la fecha actual
    return new Date();
  }
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
  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      // Si ya es ISO simple (YYYY-MM-DD), la retornamos tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Si tiene formato con zona horaria, la convertimos a Date
      dateObj = toLocalDate(date);
    } else {
      // Si es un objeto Date, necesitamos asegurarnos de que se interprete en la zona horaria de Colombia
      // Convertimos a string ISO y luego usamos toLocalDate para manejar la zona horaria correctamente
      const isoString = date.toISOString().split('T')[0]; // Obtenemos solo la parte de la fecha YYYY-MM-DD
      dateObj = toLocalDate(isoString);
    }

    // Ajustar la fecha para la zona horaria de Colombia (UTC-5)
    // Usamos getUTC* para evitar que JavaScript aplique el offset de la zona horaria local
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error normalizing date:', date, error);
    // En caso de error, devolver la fecha actual en formato ISO
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
