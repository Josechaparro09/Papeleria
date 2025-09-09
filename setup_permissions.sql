-- Script para configurar el sistema de permisos
-- Ejecutar este script en Supabase SQL Editor

-- Insertar roles básicos si no existen
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrador con acceso completo al sistema'),
('user', 'Usuario estándar con acceso limitado'),
('cashier', 'Cajero con acceso a ventas y recargas')
ON CONFLICT (name) DO NOTHING;

-- Insertar módulos de la aplicación
INSERT INTO app_modules (module_name, module_display, description) VALUES 
('dashboard', 'Dashboard', 'Panel principal con estadísticas'),
('products', 'Productos', 'Gestión de inventario y productos'),
('sales', 'Ventas', 'Sistema de ventas y transacciones'),
('services', 'Servicios', 'Gestión de servicios prestados'),
('expenses', 'Gastos', 'Control de gastos empresariales'),
('printing', 'Impresiones', 'Control de servicios de impresión'),
('recharges', 'Recargas', 'Sistema de control de caja y recargas'),
('history', 'Historial', 'Historial de cierres de caja')
ON CONFLICT (module_name) DO NOTHING;

-- Asignar permisos completos al rol admin
INSERT INTO role_module_permissions (role_id, module_name)
SELECT 
  r.id,
  m.module_name
FROM roles r
CROSS JOIN app_modules m
WHERE r.name = 'admin'
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Asignar permisos limitados al rol user (solo dashboard y productos)
INSERT INTO role_module_permissions (role_id, module_name)
SELECT 
  r.id,
  m.module_name
FROM roles r
CROSS JOIN app_modules m
WHERE r.name = 'user' 
AND m.module_name IN ('dashboard', 'products')
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Asignar permisos al rol cashier (dashboard, sales, recharges, history)
INSERT INTO role_module_permissions (role_id, module_name)
SELECT 
  r.id,
  m.module_name
FROM roles r
CROSS JOIN app_modules m
WHERE r.name = 'cashier' 
AND m.module_name IN ('dashboard', 'sales', 'recharges', 'history')
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Crear un perfil de usuario por defecto para testing
-- (Reemplaza 'user-id-aqui' con un ID de usuario real de auth.users)
INSERT INTO profiles (id, email, full_name, is_active, role_id)
SELECT 
  'user-id-aqui',
  'test@example.com',
  'Usuario de Prueba',
  true,
  r.id
FROM roles r
WHERE r.name = 'user'
ON CONFLICT (id) DO NOTHING;
