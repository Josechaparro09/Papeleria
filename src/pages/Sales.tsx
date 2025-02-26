"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Receipt,
  Plus,
  AlertCircle,
  Trash2,
  X,
  FileText,
  ShoppingCart,
  Wrench,
  Calendar,
  Search,
  Clock,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
} from "lucide-react"
import { useSales } from "../hooks/useSales"
import { useProducts } from "../hooks/useProducts"
import { useServices } from "../hooks/useServices"
import type { Sale, SaleItem } from "../types/database"
import { format, subDays, isAfter, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import formatMoney from "../utils/format"

function Sales() {
  const { sales, loading, addSale, deleteSale } = useSales()
  const { products } = useProducts()
  const { services } = useServices()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [currentSale, setCurrentSale] = useState<Sale | null>(null)
  const [saleType, setSaleType] = useState<"product" | "service">("product")
  const [saleDate, setSaleDate] = useState(format(new Date(), "yyyy-MM-dd HH:mm"))
  const [saleItems, setSaleItems] = useState<
    {
      id: string
      name: string
      price: number
      quantity: number
    }[]
  >([])

  const [itemForm, setItemForm] = useState({
    itemId: "",
    quantity: 1,
  })

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "service">("all")
  const [showFilters, setShowFilters] = useState(false)
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])

  // Apply filters
  useEffect(() => {
    if (!loading) {
      let filtered = [...sales]

      // Apply search
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        filtered = filtered.filter((sale) => {
          // Search in items
          const itemsMatch = sale.items?.some((item) => {
            const itemName = getItemName(item).toLowerCase()
            return itemName.includes(lowerSearchTerm)
          })

          // Search in sale ID or total
          const idMatch = sale.id.toLowerCase().includes(lowerSearchTerm)
          const totalMatch = sale.total.toString().includes(lowerSearchTerm)

          return itemsMatch || idMatch || totalMatch
        })
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (dateFilter === "today") {
          filtered = filtered.filter((sale) => {
            const saleDate = new Date(sale.date)
            saleDate.setHours(0, 0, 0, 0)
            return saleDate.getTime() === today.getTime()
          })
        } else if (dateFilter === "week") {
          const weekAgo = subDays(today, 7)
          filtered = filtered.filter((sale) => {
            return isAfter(parseISO(sale.date), weekAgo)
          })
        } else if (dateFilter === "month") {
          const monthAgo = subDays(today, 30)
          filtered = filtered.filter((sale) => {
            return isAfter(parseISO(sale.date), monthAgo)
          })
        }
      }

      // Apply type filter
      if (typeFilter !== "all") {
        filtered = filtered.filter((sale) => sale.type === typeFilter)
      }

      setFilteredSales(filtered)
    } else {
      setFilteredSales([])
    }
  }, [sales, searchTerm, dateFilter, typeFilter, loading])

  // Reset form when changing sale type
  useEffect(() => {
    setSaleItems([])
    setItemForm({ itemId: "", quantity: 1 })
  }, [saleType])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setItemForm({ ...itemForm, [name]: value })
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaleDate(e.target.value)
  }

  const handleTypeChange = (type: "product" | "service") => {
    setSaleType(type)
  }

  const addItem = () => {
    if (!itemForm.itemId || itemForm.quantity <= 0) return

    let itemToAdd
    if (saleType === "product") {
      const product = products.find((p) => p.id === itemForm.itemId)
      if (!product) return

      itemToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: Number(itemForm.quantity),
      }
    } else {
      const service = services.find((s) => s.id === itemForm.itemId)
      if (!service) return

      itemToAdd = {
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: Number(itemForm.quantity),
      }
    }

    // Check if item already exists in the list
    const existingItemIndex = saleItems.findIndex((item) => item.id === itemToAdd.id)

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...saleItems]
      updatedItems[existingItemIndex].quantity += Number(itemForm.quantity)
      setSaleItems(updatedItems)
    } else {
      // Add new item
      setSaleItems([...saleItems, itemToAdd])
    }

    // Reset item form
    setItemForm({ itemId: "", quantity: 1 })
  }

  const removeItem = (index: number) => {
    const newItems = [...saleItems]
    newItems.splice(index, 1)
    setSaleItems(newItems)
  }

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleAddSale = async () => {
    if (saleItems.length === 0) return

    const total = calculateTotal()

    try {
      // Eliminamos items porque no es una columna real en la tabla sales
      const saleData: Omit<Sale, "id" | "created_at" | "items"> = {
        date: saleDate,
        total,
        type: saleType,
      }

      const saleItemsData = saleItems.map((item) => {
        const itemData: Partial<SaleItem> = {
          quantity: item.quantity,
          price: item.price,
        }

        if (saleType === "product") {
          itemData.product_id = item.id
        } else {
          itemData.service_id = item.id
        }

        return itemData as Omit<SaleItem, "id" | "sale_id" | "created_at">
      })

      await addSale(saleData, saleItemsData)

      // Reset form and close modal
      setSaleDate(format(new Date(), "yyyy-MM-dd"))
      setSaleType("product")
      setSaleItems([])
      setShowAddModal(false)
    } catch (error) {
      console.error("Error adding sale:", error)
    }
  }

  const handleDeleteSale = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
      try {
        await deleteSale(id)
      } catch (error) {
        console.error("Error deleting sale:", error)
      }
    }
  }

  const viewSaleDetails = (sale: Sale) => {
    setCurrentSale(sale)
    setShowViewModal(true)
  }

  // Group sales by date
  const groupedSales: { [key: string]: Sale[] } = {}
  filteredSales.forEach((sale) => {
    const date = sale.date
    if (!groupedSales[date]) {
      groupedSales[date] = []
    }
    groupedSales[date].push(sale)
  })

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedSales).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  // Helper function to find product or service name
  const getItemName = (item: SaleItem) => {
    if (item.product_id) {
      const product = products.find((p) => p.id === item.product_id)
      return product ? product.name : "Producto desconocido"
    } else if (item.service_id) {
      const service = services.find((s) => s.id === item.service_id)
      return service ? service.name : "Servicio desconocido"
    }
    return "Desconocido"
  }

  // Calculate total sales amount
  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0)

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setDateFilter("all")
    setTypeFilter("all")
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Receipt className="text-blue-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
            <p className="text-sm text-gray-500">Gestiona tus ventas y servicios</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Nueva venta</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total ventas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalSalesAmount)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredSales.length} {filteredSales.length === 1 ? "venta" : "ventas"} registradas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Productos vendidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filteredSales
                  .filter((sale) => sale.type === "product")
                  .reduce((sum, sale) => sum + (sale.items?.length || 0), 0)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredSales.filter((sale) => sale.type === "product").length} ventas de productos
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Servicios prestados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filteredSales
                  .filter((sale) => sale.type === "service")
                  .reduce((sum, sale) => sum + (sale.items?.length || 0), 0)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Wrench className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredSales.filter((sale) => sale.type === "service").length} ventas de servicios
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar ventas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Filter size={16} className="text-gray-400" />
                <span>Filtros</span>
                {showFilters ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {}}
                  className="p-2 rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  title="Exportar ventas"
                >
                  <Download size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => {}}
                  className="p-2 rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  title="Imprimir reporte"
                >
                  <Printer size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="product">Productos</option>
                  <option value="service">Servicios</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <X size={16} className="mr-1" />
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando ventas...</p>
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center text-gray-500 py-8">
              <div className="p-4 bg-gray-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm || dateFilter !== "all" || typeFilter !== "all"
                  ? "No se encontraron ventas"
                  : "No hay ventas registradas"}
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                {searchTerm || dateFilter !== "all" || typeFilter !== "all"
                  ? "Intenta con otros términos de búsqueda o elimina los filtros aplicados."
                  : "Las ventas que registres aparecerán aquí."}
              </p>
              {(searchTerm || dateFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {sortedDates.map((date) => (
              <div key={date} className="border-b border-gray-100 last:border-b-0">
                <div className="px-6 py-3 bg-gray-50 flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">
                    {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedSales[date].map((sale) => (
                    <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-lg ${sale.type === "product" ? "bg-green-100" : "bg-purple-100"}`}
                          >
                            {sale.type === "product" ? (
                              <ShoppingCart size={18} className="text-green-600" />
                            ) : (
                              <Wrench size={18} className="text-purple-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">
                                {sale.type === "product" ? "Venta de productos" : "Venta de servicios"}
                              </span>
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                                {sale.items?.length || 0} {sale.type === "product" ? "productos" : "servicios"}
                              </span>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(sale.created_at), "HH:mm")}
                              <span className="mx-1">•</span>
                              <span className="text-gray-500">ID: {sale.id.slice(0, 8)}</span>
                            </div>
                            {sale.items && sale.items.length > 0 && (
                              <div className="mt-2 text-sm text-gray-500 line-clamp-1">
                                {sale.items.map((item) => getItemName(item)).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-blue-600 text-lg">{formatMoney(sale.total)}</p>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => viewSaleDetails(sale)}
                              className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Ver detalles"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSale(sale.id)}
                              className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar venta"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredSales.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Mostrando {filteredSales.length} de {sales.length} ventas
              </p>
              {(searchTerm || dateFilter !== "all" || typeFilter !== "all") && (
                <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <X size={14} className="mr-1" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Nueva Venta</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={handleDateChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de venta</label>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("product")}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border flex items-center justify-center ${
                        saleType === "product"
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <ShoppingCart size={16} className="mr-2" />
                      Productos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("service")}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-t border-r border-b flex items-center justify-center ${
                        saleType === "service"
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <Wrench size={16} className="mr-2" />
                      Servicios
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {saleType === "product" ? "Producto" : "Servicio"}
                    </label>
                    <select
                      name="itemId"
                      value={itemForm.itemId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Seleccionar {saleType === "product" ? "producto" : "servicio"}</option>
                      {saleType === "product"
                        ? products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {formatMoney(product.price)}
                            </option>
                          ))
                        : services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} - {formatMoney(service.price)}
                            </option>
                          ))}
                    </select>
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="quantity"
                        value={itemForm.quantity}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Sale items list */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Artículos</h4>
                  {saleItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                      <ShoppingCart className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm">No hay artículos agregados</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Selecciona {saleType === "product" ? "productos" : "servicios"} para agregar a la venta
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {saleType === "product" ? "Producto" : "Servicio"}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subtotal
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {saleItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {formatMoney(item.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                {formatMoney((item.price * item.quantity))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              Total:
                            </td>
                            <td className="px-6 py-3 text-right text-sm font-medium text-blue-600">
                              {formatMoney(calculateTotal())}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddSale}
                  disabled={saleItems.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Sale Details Modal */}
      {showViewModal && currentSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${currentSale.type === "product" ? "bg-green-100" : "bg-purple-100"}`}>
                  {currentSale.type === "product" ? (
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  ) : (
                    <Wrench className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Detalles de Venta</h3>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID de Venta</p>
                    <p className="font-medium">{currentSale.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">{format(new Date(currentSale.date), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-medium flex items-center">
                      {currentSale.type === "product" ? (
                        <>
                          <ShoppingCart size={16} className="mr-1 text-green-500" />
                          Venta de productos
                        </>
                      ) : (
                        <>
                          <Wrench size={16} className="mr-1 text-purple-500" />
                          Venta de servicios
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium text-blue-600 text-lg">{formatMoney(currentSale.total)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <ShoppingCart size={16} className="mr-2" />
                  Artículos ({currentSale.items?.length || 0})
                </h4>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {currentSale.type === "product" ? "Producto" : "Servicio"}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentSale.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getItemName(item)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatMoney(item.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatMoney((item.price * item.quantity))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                          Total:
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-blue-600">
                          {formatMoney(currentSale.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {}}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Printer size={16} className="mr-2" />
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales

