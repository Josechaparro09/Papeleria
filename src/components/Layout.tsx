// src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
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
  UserCircle,
  ChevronDown,
  Settings,
  HelpCircle,
  Search,
  Smartphone,
  Clock,
  Palette
} from 'lucide-react';
import clsx from 'clsx';
import FloatingCashRegister from './FloatingCashRegister';

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
    className={clsx(
      'flex items-center px-4 py-3 rounded-lg transition-all duration-200',
      active
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
    )}
  >
    <div className="flex items-center">
      <div className="mr-3">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
    {active && <ChevronRight className="ml-auto" size={16} />}
  </Link>
);

// Mapeo de iconos para los módulos
const getModuleIcon = (moduleName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'dashboard': <LayoutDashboard size={20} />,
    'products': <Package size={20} />,
    'sales': <Receipt size={20} />,
    'expenses': <DollarSign size={20} />,
    'printing': <Printer size={20} />,
    'services': <Wrench size={20} />,
    'recharges': <Smartphone size={20} />,
    'history': <Clock size={20} />,
    'sublimation': <Palette size={20} />
  };
  return iconMap[moduleName] || <Package size={20} />;
};

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { permissions, loading: permissionsLoading, canAccessModule } = usePermissions(user?.id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
  };

  // Crear navegación basada en permisos
  const getNavigationItems = () => {
    if (permissionsLoading) return [];
    
    return permissions.modules
      .filter(module => canAccessModule(module.name))
      .map(module => ({
        to: module.route,
        icon: getModuleIcon(module.name),
        label: module.display_name,
        moduleName: module.name
      }));
  };

  const navigation = getNavigationItems();

  // Mostrar loading mientras se cargan los permisos
  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="ml-2 text-xl font-bold text-blue-600">Multiservicios S&M</h1>
            </div>
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
                  <p className="text-xs text-gray-500">Rol: {permissions.userRole?.name || 'user'}</p>
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
        
        {/* Barra de búsqueda para móviles */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="text-gray-500" size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full py-2 pl-10 pr-4 bg-gray-100 border-gray-200 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar para desktop */}
        <aside 
          className={clsx(
            "hidden md:block border-r border-gray-200 bg-white transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <nav className={clsx(
            "h-full py-4 flex flex-col",
            isCollapsed ? "px-2" : "px-3"
          )}>
            <div className="space-y-1 flex-1">
              {navigation.map((item) => (
                isCollapsed ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={clsx(
                      "flex justify-center p-3 rounded-lg transition-all duration-200",
                      location.pathname === item.to
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    )}
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
          className={clsx(
            "fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 md:hidden",
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Store className="h-6 w-6 text-blue-600" />
              <h1 className="ml-2 text-lg font-bold text-blue-600">Multiservicios</h1>
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
                <p className="text-xs text-blue-600">Rol: {permissions.userRole?.name || 'user'}</p>
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
        <main className={clsx(
          "flex-1 overflow-y-auto pb-8 pt-6 transition-all duration-300 bg-gray-50",
          isCollapsed ? "px-8" : "px-6"
        )}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Caja flotante */}
      <FloatingCashRegister />
    </div>
  );
}

export default Layout;