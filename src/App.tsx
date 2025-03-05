import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import PrintingRecords from './pages/PrintingRecords';
import Services from './pages/Services';
import Recharges from './pages/Recharges'; // Importar la nueva página
import Invoice from './pages/Invoice'; // Importar la página de facturas
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import RechargeHistory from './pages/RechargeHistory';

// Componente de carga durante la inicialización de auth
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
    </div>
  </div>
);

// Componente de ruta protegida mejorado
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Mostrar pantalla de carga durante la inicialización
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirigir a login si no hay usuario autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Mostrar el contenido protegido si hay usuario
  return <Layout>{children}</Layout>;
};

// Componente para rutas públicas (login/register)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Mostrar pantalla de carga durante la inicialización
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirigir al dashboard si ya hay sesión
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  // Mostrar la ruta pública si no hay sesión
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/printing"
            element={
              <ProtectedRoute>
                <PrintingRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            }
          />
          {/* Nueva ruta para recargas */}
          <Route
            path="/recharges"
            element={
              <ProtectedRoute>
                <Recharges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <RechargeHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice/:saleId"
            element={
              <ProtectedRoute>
                <Invoice />
              </ProtectedRoute>
            }
          />
          {/* Ruta genérica para manejar rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;