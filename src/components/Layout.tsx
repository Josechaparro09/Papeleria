//src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Receipt,
  DollarSign,
  Printer,
  Wrench,
  LogOut,
  Menu,
  X,
  Store,
  ChevronRight,
  Bell,
  UserCircle,
  ChevronDown,
  Settings,
  HelpCircle
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, active, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-blue-500 text-white shadow-md'
        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
    }`}
  >
    <div className="flex items-center">
      <div className="mr-3">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
    {active && <ChevronRight className="ml-auto" size={16} />}
  </Link>
);

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Para dispositivos móviles
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Manejar redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
      if (window.innerWidth <= 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Inicializar
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSignOut = async () => {
    await signOut();
    closeMenu();
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (isNotificationOpen) setIsNotificationOpen(false);
  };
  
  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const navigation = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/products', icon: <Package size={20} />, label: 'Inventario' },
    { to: '/sales', icon: <Receipt size={20} />, label: 'Ventas' },
    { to: '/expenses', icon: <DollarSign size={20} />, label: 'Gastos' },
    { to: '/printing', icon: <Printer size={20} />, label: 'Impresiones' },
    { to: '/services', icon: <Wrench size={20} />, label: 'Servicios' },
  ];

  // Alertas de notificación (mock)
  const notifications = [
    { id: 1, text: 'Tienes 5 productos con stock bajo', type: 'warning' },
    { id: 2, text: 'Nueva venta registrada', type: 'info' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar superior fijo */}
      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center">
            {/* Botón móvil para mostrar menú */}
            <button 
              onClick={toggleMenu}
              className="mr-2 md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Menú principal"
            >
              <Menu size={22} />
            </button>
            
            {/* Botón desktop para colapsar */}
            <button 
              onClick={toggleSidebar}
              className="hidden md:flex mr-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Colapsar menú"
            >
              <Menu size={22} />
            </button>
            
            {/* Logo y título */}
            <div className="flex items-center">
              <Store className="h-6 w-6 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-blue-600">Papelería Manager</h1>
            </div>
          </div>
          
          {/* Acciones del navbar */}
          <div className="flex items-center space-x-2">
            {/* Notificaciones */}
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 relative"
                aria-label="Notificaciones"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Dropdown de notificaciones */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Notificaciones</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No hay notificaciones
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div key={notification.id} className={`px-4 py-3 text-sm ${
                          notification.type === 'warning' ? 'border-l-4 border-orange-500' : 'border-l-4 border-blue-500'
                        }`}>
                          <p className="text-gray-700">{notification.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Ver todas
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Menú de usuario */}
            <div className="relative">
              <button 
                onClick={toggleUserMenu}
                className="flex items-center space-x-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Menú de usuario"
              >
                <UserCircle size={20} />
                <span className="text-sm font-medium hidden sm:block">
                  {user?.email?.split('@')[0]}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {/* Dropdown de usuario */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                      <UserCircle size={16} className="mr-2" />
                      <span>Perfil</span>
                    </Link>
                    <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                      <Settings size={16} className="mr-2" />
                      <span>Configuración</span>
                    </Link>
                    <Link to="/help" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                      <HelpCircle size={16} className="mr-2" />
                      <span>Ayuda</span>
                    </Link>
                  </div>
                  <div className="py-1 border-t border-gray-200">
                    <button 
                      onClick={handleSignOut}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-2" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar para desktop */}
        <aside 
          className={`hidden md:block border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <nav className={`h-full py-4 flex flex-col ${isCollapsed ? 'px-2' : 'px-3'}`}>
            <div className="space-y-1 flex-1">
              {navigation.map((item) => (
                isCollapsed ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex justify-center p-3 rounded-lg transition-all duration-200 ${
                      location.pathname === item.to
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    title={item.label}
                  >
                    {item.icon}
                  </Link>
                ) : (
                  <NavItem
                    key={item.to}
                    {...item}
                    active={location.pathname === item.to}
                  />
                )
              ))}
            </div>
            
            {!isCollapsed && (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-3 mt-auto rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            )}
            
            {isCollapsed && (
              <button
                onClick={handleSignOut}
                className="flex justify-center p-3 mt-auto rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            )}
          </nav>
        </aside>
        
        {/* Overlay para móvil */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-gray-800 bg-opacity-50 z-30 md:hidden"
            onClick={closeMenu}
          ></div>
        )}
        
        {/* Sidebar para móvil */}
        <aside 
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 md:hidden ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Store className="h-6 w-6 text-blue-600" />
              <h1 className="ml-2 text-lg font-bold text-blue-600">Papelería</h1>
            </div>
            <button 
              onClick={closeMenu} 
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Perfil móvil */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <UserCircle size={36} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          
          <nav className="mt-2 px-2 space-y-1 overflow-y-auto flex-1">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                active={location.pathname === item.to}
                onClick={closeMenu}
              />
            ))}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className={`flex-1 overflow-y-auto pb-8 ${
          isCollapsed ? 'px-8' : 'px-6'
        } pt-6 transition-all duration-300`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;