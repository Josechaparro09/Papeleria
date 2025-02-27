// src/utils/dateHelper.ts
import { format as dateFnsFormat, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a un formato legible, evitando problemas de zona horaria
 * @param isoDate La fecha en formato ISO (YYYY-MM-DD)
 * @param formatStr El formato de fecha deseado
 * @param options Opciones adicionales
 * @returns La fecha formateada
 */
export function formatDate(isoDate: string, formatStr: string, options: any = {}): string {
  // Aseguramos que la fecha se interprete correctamente añadiendo la hora
  const date = parseISO(`${isoDate}T12:00:00`);
  return dateFnsFormat(date, formatStr, { locale: es, ...options });
}

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 * @returns La fecha actual en formato ISO
 */
export function getTodayISO(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}