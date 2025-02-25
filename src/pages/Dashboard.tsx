import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Receipt, DollarSign, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { stats, loading } = useDashboard();
  const { sales } = useSales();
  const { products } = useProducts();
  
  // Get popular products (products that were sold most frequently)
  const [popularProducts, setPopularProducts] = useState<{ name: string; count: number }[]>([]);
  // Get recent sales (most recent 5 sales)
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    if (sales.length > 0 && products.length > 0) {
      // Process sales data to find popular products
      const productSales: { [key: string]: number } = {};
      
      sales.forEach(sale => {
        if (sale.type === 'product' && sale.items) {
          sale.items.forEach(item => {
            if (item.product_id) {
              productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
            }
          });
        }
      });
      
      // Map product IDs to names and sort by count
      const productPopularity = Object.entries(productSales)
        .map(([productId, count]) => {
          const product = products.find(p => p.id === productId);
          return {
            name: product ? product.name : 'Producto desconocido',
            count
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Get top 5
      
      setPopularProducts(productPopularity);
      
      // Get the 5 most recent sales
      const recent = [...sales]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      setRecentSales(recent);
    }
  }, [sales, products]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <BarChart3 className="text-blue-600" />
          <span className="text-gray-600">Resumen del negocio</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando estadísticas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas del día</p>
                <p className="text-2xl font-bold text-gray-900">${stats.dailySales.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Productos bajos en stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
              </div>
              <div className="relative">
                <Package className="text-orange-500" />
                {stats.lowStockProducts > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">
                    !
                  </span>
                )}
              </div>
            </div>
            {stats.lowStockProducts > 0 && (
              <div className="mt-2">
                <Link 
                  to="/products" 
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                >
                  <AlertTriangle size={12} className="mr-1" />
                  Ver productos
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas del mes</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthlySales.toFixed(2)}</p>
              </div>
              <Receipt className="text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gastos del mes</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthlyExpenses.toFixed(2)}</p>
              </div>
              <DollarSign className="text-red-500" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimas ventas</h2>
          {recentSales.length === 0 ? (
            <div className="text-sm text-gray-600">No hay ventas registradas</div>
          ) : (
            <div className="space-y-3">
              {recentSales.map(sale => (
                <div key={sale.id} className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {sale.type === 'product' ? 'Venta de productos' : 'Venta de servicios'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(sale.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-blue-600">
                        ${sale.total.toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {sale.items?.length || 0} {sale.type === 'product' ? 'productos' : 'servicios'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <Link 
                  to="/sales" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver todas las ventas
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos populares</h2>
          {popularProducts.length === 0 ? (
            <div className="text-sm text-gray-600">No hay productos registrados</div>
          ) : (
            <div className="space-y-4">
              {popularProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.count} {product.count === 1 ? 'unidad' : 'unidades'} vendidas
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <Link 
                  to="/products" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver todos los productos
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento Mensual</h2>
        
        {/* Monthly statistics summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Ventas</p>
            <p className="text-xl font-bold text-blue-600">${stats.monthlySales.toFixed(2)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Gastos</p>
            <p className="text-xl font-bold text-red-600">${stats.monthlyExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Ganancia</p>
            <p className="text-xl font-bold text-green-600">
              ${(stats.monthlySales - stats.monthlyExpenses).toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Profit margin calculation */}
        {stats.monthlySales > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Margen de ganancia</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ 
                  width: `${Math.min(100, ((stats.monthlySales - stats.monthlyExpenses) / stats.monthlySales * 100))}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.monthlySales - stats.monthlyExpenses) / stats.monthlySales * 100).toFixed(1)}%
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <div className="space-x-4">
            <Link 
              to="/sales" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver detalles de ventas
            </Link>
            <Link 
              to="/expenses" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver detalles de gastos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;