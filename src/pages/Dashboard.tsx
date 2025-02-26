"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  TrendingUp,
  Package,
  Receipt,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Clock,
} from "lucide-react"
import { useDashboard } from "../hooks/useDashboard"
import { useSales } from "../hooks/useSales"
import { useProducts } from "../hooks/useProducts"
import { format } from "date-fns"
import { Link } from "react-router-dom"

function Dashboard() {
  const { stats, loading } = useDashboard()
  const { sales } = useSales()
  const { products } = useProducts()

  const [popularProducts, setPopularProducts] = useState<{ name: string; count: number }[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])

  useEffect(() => {
    if (sales.length > 0 && products.length > 0) {
      const productSales: { [key: string]: number } = {}

      sales.forEach((sale) => {
        if (sale.type === "product" && sale.items) {
          sale.items.forEach((item) => {
            if (item.product_id) {
              productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity
            }
          })
        }
      })

      const productPopularity = Object.entries(productSales)
        .map(([productId, count]) => {
          const product = products.find((p) => p.id === productId)
          return {
            name: product ? product.name : "Producto desconocido",
            count,
          }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setPopularProducts(productPopularity)

      const recent = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

      setRecentSales(recent)
    }
  }, [sales, products])

  // Calculate profit percentage change (mock data for demonstration)
  const profitChange = 12.5
  const isPositiveChange = profitChange > 0

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visualiza el rendimiento de tu negocio</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <BarChart3 className="text-blue-600 h-5 w-5" />
          <span className="text-gray-600 font-medium">Resumen del negocio</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
            <p className="text-sm font-medium text-gray-500">Ventas del día</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-bold">${stats.dailySales.toFixed(2)}</span>
              <div className="p-2 bg-green-50 rounded-full">
                <TrendingUp className="text-green-500 h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <ArrowUpRight className="text-green-500 h-3 w-3 mr-1" />
              <span className="text-green-500 font-medium">8.2%</span> más que ayer
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-orange-500">
            <p className="text-sm font-medium text-gray-500">Productos bajos en stock</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.lowStockProducts}</span>
              <div className="p-2 bg-orange-50 rounded-full">
                <Package className="text-orange-500 h-5 w-5" />
              </div>
            </div>
            {stats.lowStockProducts > 0 ? (
              <Link to="/products" className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                <AlertTriangle size={12} className="mr-1" />
                Ver productos
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            ) : (
              <p className="mt-2 text-xs text-gray-500">Todos los productos tienen stock suficiente</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
            <p className="text-sm font-medium text-gray-500">Ventas del mes</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-bold">${stats.monthlySales.toFixed(2)}</span>
              <div className="p-2 bg-blue-50 rounded-full">
                <Receipt className="text-blue-500 h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <ArrowUpRight className="text-green-500 h-3 w-3 mr-1" />
              <span className="text-green-500 font-medium">15.3%</span> más que el mes pasado
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-red-500">
            <p className="text-sm font-medium text-gray-500">Gastos del mes</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-bold">${stats.monthlyExpenses.toFixed(2)}</span>
              <div className="p-2 bg-red-50 rounded-full">
                <DollarSign className="text-red-500 h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <ArrowDownRight className="text-red-500 h-3 w-3 mr-1" />
              <span className="text-red-500 font-medium">3.2%</span> más que el mes pasado
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Rendimiento Mensual</h2>
            <p className="text-sm text-gray-500 mt-1">Resumen de ventas, gastos y ganancias del mes actual</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1 flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Ventas
                </p>
                <p className="text-2xl font-bold text-blue-700">${stats.monthlySales.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-1 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Gastos
                </p>
                <p className="text-2xl font-bold text-red-700">${stats.monthlyExpenses.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Ganancia
                </p>
                <p className="text-2xl font-bold text-green-700">
                  ${(stats.monthlySales - stats.monthlyExpenses).toFixed(2)}
                </p>
                <div className="flex items-center mt-1">
                  {isPositiveChange ? (
                    <ArrowUpRight className="text-green-600 h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="text-red-600 h-3 w-3 mr-1" />
                  )}
                  <span className={`text-xs font-medium ${isPositiveChange ? "text-green-600" : "text-red-600"}`}>
                    {profitChange}% {isPositiveChange ? "más" : "menos"} que el mes pasado
                  </span>
                </div>
              </div>
            </div>

            {stats.monthlySales > 0 && (
              <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Margen de ganancia</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      (((stats.monthlySales - stats.monthlyExpenses) / stats.monthlySales) * 100) > 20
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {(((stats.monthlySales - stats.monthlyExpenses) / stats.monthlySales) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((stats.monthlySales - stats.monthlyExpenses) / stats.monthlySales) * 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Un margen saludable debe estar por encima del 20%</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
            <Link
              to="/sales"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Ver detalles de ventas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/expenses"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Ver detalles de gastos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Productos Populares</h2>
            <p className="text-sm text-gray-500 mt-1">Los productos más vendidos este mes</p>
          </div>
          <div className="p-6">
            {popularProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No hay productos registrados</p>
              </div>
            ) : (
              <div className="space-y-5">
                {popularProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {product.count} {product.count === 1 ? "unidad" : "unidades"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <Link
              to="/products"
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full"
            >
              Ver todos los productos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Últimas Ventas</h2>
          <p className="text-sm text-gray-500 mt-1">Transacciones más recientes</p>
        </div>
        <div className="p-6">
          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No hay ventas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${sale.type === "product" ? "bg-blue-50" : "bg-purple-50"}`}>
                        {sale.type === "product" ? (
                          <ShoppingCart
                            className={`h-5 w-5 ${sale.type === "product" ? "text-blue-500" : "text-purple-500"}`}
                          />
                        ) : (
                          <Receipt
                            className={`h-5 w-5 ${sale.type === "product" ? "text-blue-500" : "text-purple-500"}`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {sale.type === "product" ? "Venta de productos" : "Venta de servicios"}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(sale.date), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-blue-600">${sale.total.toFixed(2)}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {sale.items?.length || 0} {sale.type === "product" ? "productos" : "servicios"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <Link
            to="/sales"
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full"
          >
            Ver todas las ventas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

