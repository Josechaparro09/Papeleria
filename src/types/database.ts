// src/types/database.ts
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  icon: string;
  route: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppModule {
  id: number;
  module_name: string;
  module_display: string;
  description?: string;
  created_at: string;
}

export interface RoleModulePermission {
  id: number;
  role_id: number;
  module_name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  role_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category?: string;
  purchase_price: number;
  public_price: number;
  stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  barcode: string;
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
  type: 'product' | 'service' | 'mixed';
  customer_name?: string | null;
  payment_method?: string | null;
  cash_register_id?: string | null; // Relación con la caja abierta
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
  subtotal: number;
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

// Nueva interfaz para manejar recargas
  export interface Recharge {
    id: string;
    date: string;
    opening_balance: number; // Saldo inicial
    closing_balance: number; // Saldo final
    sales_amount: number; // Monto de ventas (calculado automáticamente)
    profit?: number; // Ganancia opcional
    notes?: string; // Notas adicionales
    created_at: string;
    updated_at?: string;
  }

  // src/types/database.ts
export interface CashRegister {
  id: string;
  date: string;              // Fecha de la caja (ISO: YYYY-MM-DD)
  opening_balance: number;   // Saldo inicial al abrir caja
  closing_balance?: number;  // Saldo final al cerrar caja (opcional hasta cerrar)
  created_at: string;
  updated_at?: string;
}

export interface RechargeTransaction {
  id: string;
  cash_register_id: string;  // Relación con la caja del día
  description: string;       // Descripción de la recarga (ej. "Recarga Claro")
  amount: number;            // Valor de la recarga (ej. 10000)
  created_at: string;
}

// Tipos para el sistema de sublimación
export interface SublimationProduct {
  id: string;
  name: string;
  description?: string;
  category: 'taza' | 'camiseta' | 'gorra' | 'mousepad' | 'cojin' | 'otro';
  base_price: number;        // Precio base del producto en blanco
  stock: number;
  min_stock: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SublimationService {
  id: string;
  name: string;
  description?: string;
  base_price: number;        // Precio base del servicio
  sublimation_cost: number;  // Costo de sublimación
  products_used?: SublimationServiceProduct[]; // Productos utilizados en este servicio (opcional para compatibilidad)
  created_at: string;
  updated_at: string;
}

// Tipo para la respuesta de Supabase con relaciones
export interface SublimationServiceWithProducts extends Omit<SublimationService, 'products_used'> {
  sublimation_service_products?: SublimationServiceProduct[];
}

export interface SublimationServiceProduct {
  id: string;
  service_id: string;
  product_id: string;
  quantity: number;
  product?: SublimationProduct; // Relación con el producto
}

export interface SublimationSale {
  id: string;
  date: string;
  service_id: string;
  service?: SublimationService; // Relación con el servicio
  quantity: number;
  unit_price: number;
  total: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_method?: 'Efectivo' | 'Tarjeta de crédito' | 'Tarjeta de débito' | 'Transferencia' | 'Otro';
  customer_name?: string;
  discount?: number;
  amount_paid?: number;
  change_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SublimationSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product?: SublimationProduct;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
}