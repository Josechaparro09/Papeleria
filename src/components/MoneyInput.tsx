export const formatCurrency = (value: string | number) => {
  // Si el valor está vacío, devolver cadena vacía
  if (value === '') return '';

  // Convertir a string y eliminar cualquier separador existente
  const cleanedValue = value.toString().replace(/[^\d]/g, '');
  
  // Convertir a número entero
  const numericValue = parseInt(cleanedValue, 10);
  
  // Verificar si es un número válido
  if (isNaN(numericValue)) return '';
  
  // Formatear como moneda con separador de miles
  return numericValue.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// Función para desformatear (eliminar separadores)
export const unformatCurrency = (value: string) => {
  return value.replace(/\./g, '');
};