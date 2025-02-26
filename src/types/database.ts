//scr/types/database.ts
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  type: 'product' | 'service';
  items?: SaleItem[]; // items es opcional porque no es una columna real
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  service_id?: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
}

export interface PrintingRecord {
  id: string;
  date: string;
  copies: number;
  prints: number;
  damaged_sheets: number;
  cost_per_sheet: number;
  price_per_copy?: number; // Precio por copia (opcional)
  price_per_print?: number; // Precio por impresión (opcional)
  created_at: string;
}