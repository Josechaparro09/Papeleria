# Configuración del Sistema de Sublimación

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://isvrqzztebdkquhsxkly.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdnJxenp0ZWJka3F1aHN4a2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDA0NzgsImV4cCI6MjA1NjExNjQ3OH0.FTdFiEdvkc7pqd1YZfKzsfHv64uWel8Hme_S2soFCag
```

## Estructura de la Base de Datos

### Tablas Creadas:
- `sublimation_products` - Productos base para sublimación
- `sublimation_services` - Servicios de sublimación
- `sublimation_service_products` - Relación servicios-productos
- `sublimation_sales` - Ventas de sublimación
- `sublimation_sale_items` - Items detallados de venta

### Características:
- ✅ RLS (Row Level Security) habilitado
- ✅ Triggers automáticos para `updated_at`
- ✅ Cálculo automático de totales
- ✅ Índices para optimización
- ✅ Validaciones de datos
- ✅ Vistas para consultas complejas

## Hooks Creados:
- `useSublimationProducts` - Gestión de productos base
- `useSublimationServices` - Gestión de servicios
- `useSublimationSales` - Gestión de ventas

## Funcionalidades Implementadas:
- ✅ CRUD completo para productos, servicios y ventas
- ✅ Búsqueda y filtrado
- ✅ Estadísticas en tiempo real
- ✅ Integración con sistema de permisos existente
- ✅ Interfaz responsive y moderna

## Uso:
1. Configura las variables de entorno
2. Ejecuta `npm install` para instalar dependencias
3. Ejecuta `npm run dev` para iniciar el servidor de desarrollo
4. Navega a `/sublimations` para acceder al módulo
