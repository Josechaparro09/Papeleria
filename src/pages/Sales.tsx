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
import { format, subDays, isAfter, parseISO, addDays, startOfDay, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import formatMoney from "../utils/format"
import { PAYMENT_METHODS } from "../hooks/useSales"
import toast from "react-hot-toast"
import { useNavigate } from 'react-router-dom'
import { toLocalDate, formatDateColombia, normalizeToISODate } from "../utils/dateHelper"

function Sales() {
  const { sales, loading, addSale, deleteSale } = useSales()
  const { products } = useProducts()
  const { services } = useServices()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [currentSale, setCurrentSale] = useState<Sale | null>(null)
  const [saleType, setSaleType] = useState<"product" | "service">("product")
  const [saleDate, setSaleDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [saleItems, setSaleItems] = useState<
    {
      id: string
      name: string
      price: number
      quantity: number
      type: "product" | "service"
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
  const [barcodeInput, setBarcodeInput] = useState('');
  const navigate = useNavigate();

const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setBarcodeInput(value);

  // Realiza la búsqueda automáticamente
  if (value) {
    const product = products.find((p) => p.barcode === value);
    if (product) {
      const itemToAdd = {
        id: product.id,
        name: product.name,
        price: product.public_price,
        quantity: 1,
        type: "product" as const
      };

      // Check if item already exists in the list
      const existingItemIndex = saleItems.findIndex((item) => item.id === itemToAdd.id && item.type === "product");

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...saleItems];
        updatedItems[existingItemIndex].quantity += 1;
        setSaleItems(updatedItems);
      } else {
        // Add new item
        setSaleItems([...saleItems, itemToAdd]);
      }

      // Reset barcode input
      setBarcodeInput('');
    } else {
    }
  }
};


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

          // Search in sale ID, total, customer name
          const idMatch = sale.id.toLowerCase().includes(lowerSearchTerm)
          const totalMatch = sale.total.toString().includes(lowerSearchTerm)
          const customerNameMatch = sale.customer_name?.toLowerCase().includes(lowerSearchTerm)

          return itemsMatch || idMatch || totalMatch || customerNameMatch
        })
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date()
        const today = startOfDay(now)

        filtered = filtered.filter((sale) => {
          try {
            if (!sale.date) return false;
            
            // Usar toLocalDate para manejar correctamente la zona horaria
            const saleDate = toLocalDate(sale.date);
            const compareSaleDate = startOfDay(saleDate);

            if (dateFilter === "today") {
              return isSameDay(compareSaleDate, today)
            } else if (dateFilter === "week") {
              return isAfter(compareSaleDate, subDays(today, 7)) && !isAfter(compareSaleDate, today)
            } else if (dateFilter === "month") {
              return isAfter(compareSaleDate, subDays(today, 30)) && !isAfter(compareSaleDate, today)
            }
            return true
          } catch (error) {
            console.error(`Error filtering date for sale ${sale.id}:`, error)
            return false
          }
        })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setItemForm({ ...itemForm, [name]: value })
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Tomamos el valor directamente del input date, que ya está en formato YYYY-MM-DD
    // Este formato es independiente de la zona horaria y representa la fecha seleccionada
    // por el usuario en la interfaz
    const newDate = e.target.value
    setSaleDate(newDate)
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
        price: product.public_price,
        quantity: Number(itemForm.quantity),
        type: "product" as const
      }
    } else {
      const service = services.find((s) => s.id === itemForm.itemId)
      if (!service) return

      itemToAdd = {
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: Number(itemForm.quantity),
        type: "service" as const
      }
    }

    // Check if item already exists in the list
    const existingItemIndex = saleItems.findIndex((item) => item.id === itemToAdd.id && item.type === itemToAdd.type)

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
    
    // Manejar la fecha correctamente para la zona horaria de Colombia
    // Usamos directamente el valor de saleDate que ya está en formato YYYY-MM-DD
    // y lo pasamos a normalizeToISODate para asegurar que se maneje correctamente
    const formattedDate = saleDate;

    try {
      // Determine sale type based on items
      const hasProducts = saleItems.some(item => item.type === "product");
      const hasServices = saleItems.some(item => item.type === "service");
      
      // If both products and services are present, set type to "mixed"
      // Otherwise, use the type of the items
      const saleTypeToUse = hasProducts && hasServices ? "mixed" : (hasProducts ? "product" : "service");

      await addSale(
        {
          date: formattedDate,
          total,
          type: saleTypeToUse,
          customer_name: customerName || null,
          payment_method: paymentMethod || null
        },
        saleItems.map(item => ({
          product_id: item.type === "product" ? item.id : undefined,
          service_id: item.type === "service" ? item.id : undefined,
          quantity: item.quantity,
          price: item.price
        }))
      )

      // Reset form
      setSaleDate(format(new Date(), "yyyy-MM-dd"))
      setSaleType("product")
      setSaleItems([])
      setCustomerName('')
      setPaymentMethod('')
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

  // Group sales by date
  const groupedSales: { [key: string]: Sale[] } = {}
  filteredSales.forEach((sale) => {
    try {
      if (!sale.date) {
        console.error(`Sale ${sale.id} has no date`);
        return;
      }
      
      // Usar toLocalDate para manejar correctamente la zona horaria
      const saleDate = toLocalDate(sale.date);
      // Formatear la fecha usando normalizeToISODate para asegurar formato YYYY-MM-DD
      const formattedDate = normalizeToISODate(saleDate);
      
      if (!groupedSales[formattedDate]) {
        groupedSales[formattedDate] = [];
      }
      groupedSales[formattedDate].push(sale);
    } catch (error) {
      console.error(`Error processing date for sale ${sale.id}:`, error);
    }
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedSales).sort((a, b) => {
    try {
      const dateA = toLocalDate(a);
      const dateB = toLocalDate(b);
      return dateB.getTime() - dateA.getTime();
    } catch (error) {
      console.error('Error sorting dates:', error);
      return 0;
    }
  });

  // Función auxiliar para formatear fechas de manera segura
  const formatSaleDate = (dateString: string) => {
    try {
      // Usar formatDateColombia para manejar correctamente la zona horaria
      return formatDateColombia(dateString, "EEEE, d 'de' MMMM 'de' yyyy")
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Fecha inválida'
    }
  }

  // Calculate total sales amount
  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0)

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setDateFilter("all")
    setTypeFilter("all")
  }

  const handleGenerateInvoice = (saleId: string) => {
    navigate(`/invoice/${saleId}`);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  .filter((sale) => sale.type === "product" || sale.type === "mixed")
                  .reduce((sum, sale) => {
                    // Count only product items
                    return sum + (sale.items?.filter(item => item.product_id)?.length || 0)
                  }, 0)}
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
                  .filter((sale) => sale.type === "service" || sale.type === "mixed")
                  .reduce((sum, sale) => {
                    // Count only service items
                    return sum + (sale.items?.filter(item => item.service_id)?.length || 0)
                  }, 0)}
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Ventas mixtas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filteredSales.filter((sale) => sale.type === "mixed").length}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-full">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Productos y servicios
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar ventas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="pl-10 pr-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
              </select>
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="pl-10 pr-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">Todos los tipos</option>
                <option value="product">Productos</option>
                <option value="service">Servicios</option>
                <option value="mixed">Mixtas</option>
              </select>
              <ShoppingCart className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
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
                  {formatSaleDate(date)}
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {groupedSales[date].map((sale) => (
                  <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            sale.type === "product" 
                              ? "bg-green-100" 
                              : sale.type === "service" 
                                ? "bg-purple-100" 
                                : "bg-amber-100"
                          }`}
                        >
                          {sale.type === "product" ? (
                            <ShoppingCart size={18} className="text-green-600" />
                          ) : sale.type === "service" ? (
                            <Wrench size={18} className="text-purple-600" />
                          ) : (
                            <ShoppingCart size={18} className="text-amber-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">
                              {sale.type === "product" 
                                ? "Venta de productos" 
                                : sale.type === "service" 
                                  ? "Venta de servicios" 
                                  : "Venta mixta"}
                            </span>
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                              {sale.type === "mixed" 
                                ? `${sale.items?.filter(item => item.product_id)?.length || 0} productos, ${sale.items?.filter(item => item.service_id)?.length || 0} servicios`
                                : `${sale.items?.length || 0} ${sale.type === "product" ? "productos" : "servicios"}`}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDateColombia(sale.created_at, "HH:mm")}
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
                            onClick={() => handleGenerateInvoice(sale.id)}
                            className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Generar Factura"
                          >
                            <Receipt size={18} className="text-blue-600" />
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
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              {saleType === "product" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escanear código de barras
                  </label>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={handleBarcodeInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Escanear código de barras"
                    autoFocus
                  />
                </div>
              )}
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de ítem a agregar</label>
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

              {/* Customer and Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente (opcional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Seleccionar método de pago</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
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
                              {product.name} - {formatMoney(product.public_price)}
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

                {/* Items List */}
                {saleItems.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Ítems agregados</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subtotal
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {saleItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.type === "product" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-purple-100 text-purple-800"
                                }`}>
                                  {item.type === "product" ? "Producto" : "Servicio"}
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatMoney(item.price)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatMoney(item.price * item.quantity)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Total */}
              {saleItems.length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total:</span>
                    <span className="text-xl font-bold text-blue-600">{formatMoney(calculateTotal())}</span>
                  </div>
                </div>
              )}

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
                <div className={`p-2 rounded-lg ${
                  currentSale.type === "product" 
                    ? "bg-green-100" 
                    : currentSale.type === "service" 
                      ? "bg-purple-100" 
                      : "bg-amber-100"
                }`}>
                  {currentSale.type === "product" ? (
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  ) : currentSale.type === "service" ? (
                    <Wrench className="h-5 w-5 text-purple-600" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 text-amber-600" />
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
                    <p className="font-medium">{formatDateColombia(currentSale.date, "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-medium flex items-center">
                      {currentSale.type === "product" ? (
                        <>
                          <ShoppingCart size={16} className="mr-1 text-green-500" />
                          Venta de productos
                        </>
                      ) : currentSale.type === "service" ? (
                        <>
                          <Wrench size={16} className="mr-1 text-purple-500" />
                          Venta de servicios
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={16} className="mr-1 text-amber-500" />
                          Venta mixta
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium text-blue-600 text-lg">{formatMoney(currentSale.total)}</p>
                  </div>
                  {currentSale.customer_name && (
                    <div>
                      <p className="text-sm text-gray-500">Nombre del Cliente</p>
                      <p className="font-medium">{currentSale.customer_name}</p>
                    </div>
                  )}
                  {currentSale.payment_method && (
                    <div>
                      <p className="text-sm text-gray-500">Método de Pago</p>
                      <p className="font-medium">{currentSale.payment_method}</p>
                    </div>
                  )}
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
                  onClick={() => {handleGenerateInvoice(currentSale.id)}}
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