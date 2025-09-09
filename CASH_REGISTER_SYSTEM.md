# Sistema de Caja General Flotante

## 🏦 Descripción General

El sistema de caja general flotante es una funcionalidad que permite gestionar todas las operaciones de venta del negocio desde una interfaz unificada y siempre visible. El componente flotante se mantiene en la esquina inferior derecha de la pantalla, proporcionando acceso rápido al estado de la caja y controles de apertura/cierre.

## ✨ Características Principales

### 🎯 **Componente Flotante**
- **Posición fija** en la esquina inferior derecha
- **Expandible/colapsable** para ahorrar espacio
- **Estado visual** con indicadores de color
- **Acceso rápido** a todas las funciones de caja

### 💰 **Gestión de Caja**
- **Apertura de caja** con saldo inicial
- **Cierre de caja** con saldo final
- **Balance en tiempo real** actualizado automáticamente
- **Historial de transacciones** del día

### 📊 **Integración Completa**
- **Ventas generales** (productos y servicios)
- **Ventas de sublimación** 
- **Gastos del día**
- **Recargas y egresos**
- **Estadísticas en tiempo real**

## 🏗️ Arquitectura del Sistema

### **Hooks Principales**

#### `useCashRegister.ts`
Hook principal que maneja toda la lógica de caja:
```typescript
interface CashRegisterStats {
  totalSales: number;        // Total de ventas del día
  totalExpenses: number;     // Total de gastos del día
  totalRecharges: number;    // Total de recargas del día
  currentBalance: number;    // Balance actual de caja
  openingBalance: number;    // Saldo de apertura
  closingBalance?: number;   // Saldo de cierre (opcional)
}
```

#### `useSalesWithCash.ts`
Hook mejorado para ventas que se integra automáticamente con la caja:
- Actualiza estadísticas de caja al registrar ventas
- Reduce stock de productos automáticamente
- Sincroniza con el balance de caja

#### `useSublimationSalesWithCash.ts`
Hook específico para ventas de sublimación:
- Integración completa con caja general
- Actualización automática de estadísticas
- Sincronización de balances

#### `useDashboardWithCash.ts`
Dashboard mejorado que incluye información de caja:
- Estado de caja en tiempo real
- Balance actual
- Ventas del día
- Recargas y egresos

### **Componentes**

#### `FloatingCashRegister.tsx`
Componente flotante principal:
- **Header compacto** con estado y balance
- **Contenido expandible** con estadísticas detalladas
- **Modales** para apertura, cierre y recargas
- **Transacciones recientes** en vista compacta

## 🎨 Interfaz de Usuario

### **Estado Visual**
- 🟢 **Verde**: Caja abierta y balance positivo
- 🟡 **Amarillo**: Caja abierta pero balance negativo
- 🔴 **Rojo**: Caja cerrada

### **Funcionalidades del Flotante**

#### **Vista Compacta**
- Estado de caja (abierta/cerrada)
- Balance actual
- Indicador de expansión

#### **Vista Expandida**
- **Estadísticas del día**:
  - Ventas totales
  - Gastos totales
  - Balance actual
  - Saldo de apertura
- **Controles de caja**:
  - Botón "Abrir Caja" (si está cerrada)
  - Botón "Recarga" (si está abierta)
  - Botón "Cerrar Caja" (si está abierta)
  - Botón "Actualizar" para refrescar datos
- **Transacciones recientes**:
  - Últimas 3 recargas
  - Montos y descripciones

### **Modales**

#### **Modal de Apertura de Caja**
- Campo para saldo inicial
- Validación de monto mínimo
- Confirmación de apertura

#### **Modal de Cierre de Caja**
- Balance calculado automáticamente
- Campo para saldo final
- Confirmación de cierre

#### **Modal de Recarga**
- Descripción de la recarga
- Monto a descontar
- Validación de balance suficiente

## 🔄 Flujo de Trabajo

### **Apertura de Caja**
1. Usuario hace clic en "Abrir Caja"
2. Ingresa saldo inicial
3. Sistema crea registro en `cash_registers`
4. Actualiza estado visual a "Abierta"
5. Habilita controles de operación

### **Operación Normal**
1. Todas las ventas se registran automáticamente
2. Balance se actualiza en tiempo real
3. Estadísticas se refrescan automáticamente
4. Usuario puede agregar recargas si es necesario

### **Cierre de Caja**
1. Usuario hace clic en "Cerrar Caja"
2. Sistema muestra balance calculado
3. Usuario confirma saldo final
4. Sistema actualiza registro de caja
5. Estado cambia a "Cerrada"

## 📊 Integración con Ventas

### **Ventas Generales**
- Se integran automáticamente al balance
- Actualizan estadísticas de caja
- Reducen stock de productos
- Se reflejan en el dashboard

### **Ventas de Sublimación**
- Integración completa con caja general
- Estadísticas separadas pero unificadas
- Balance actualizado en tiempo real
- Reportes consolidados

### **Gastos**
- Se descuentan del balance
- Actualización automática de estadísticas
- Integración con sistema de caja

## 🛠️ Configuración Técnica

### **Base de Datos**
- **`cash_registers`**: Registros diarios de caja
- **`recharge_transactions`**: Transacciones de recarga
- **Integración automática** con tablas de ventas

### **Estados de la Aplicación**
- **Estado global** de caja en `useCashRegister`
- **Sincronización** entre componentes
- **Actualización automática** de estadísticas

### **Validaciones**
- **Balance suficiente** para recargas
- **Caja abierta** para operaciones
- **Datos válidos** en formularios

## 🚀 Beneficios

### **Para el Usuario**
- **Acceso rápido** a información de caja
- **Control total** de operaciones
- **Visibilidad** del estado financiero
- **Interfaz unificada** para todas las ventas

### **Para el Negocio**
- **Control de caja** centralizado
- **Trazabilidad** completa de transacciones
- **Estadísticas** en tiempo real
- **Integración** de todos los módulos

## 🔧 Mantenimiento

### **Actualización de Datos**
- **Automática** al realizar operaciones
- **Manual** con botón de actualizar
- **Sincronización** entre componentes

### **Monitoreo**
- **Logs** de operaciones de caja
- **Alertas** de balance negativo
- **Historial** de transacciones

## 📈 Próximas Mejoras

- **Reportes** de caja detallados
- **Exportación** de datos
- **Alertas** automáticas
- **Integración** con sistemas de pago
- **Backup** automático de datos

---

El sistema de caja general flotante proporciona una solución completa y unificada para la gestión financiera del negocio, integrando todas las operaciones de venta en una interfaz moderna y fácil de usar.
