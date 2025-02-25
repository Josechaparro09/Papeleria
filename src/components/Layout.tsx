//src/components/Layout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Receipt,
  DollarSign,
  Printer,
  Wrench,
  LogOut
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavItem = ({ to, icon, label, active }: NavItemProps) => (
  <Link
    to={to}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'text-gray-600 hover:bg-blue-50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/products', icon: <Package size={20} />, label: 'Inventario' },
    { to: '/sales', icon: <Receipt size={20} />, label: 'Ventas' },
    { to: '/expenses', icon: <DollarSign size={20} />, label: 'Gastos' },
    { to: '/printing', icon: <Printer size={20} />, label: 'Impresiones' },
    { to: '/services', icon: <Wrench size={20} />, label: 'Servicios' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-xl font-bold text-blue-600">Papelería Manager</h1>
        </div>
        <nav className="mt-8 space-y-2 px-2">
          {navigation.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              active={location.pathname === item.to}
            />
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={() => signOut()}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors w-full px-4 py-2"
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;