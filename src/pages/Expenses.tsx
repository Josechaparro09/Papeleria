"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  DollarSign,
  Plus,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Calendar,
  Search,
  ArrowUpDown,
  CreditCard,
  TrendingDown,
  Wallet,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Printer,
  FileText,
  BadgeDollarSign,
} from "lucide-react"
import { useExpenses } from "../hooks/useExpenses"
import type { Expense } from "../types/database"
import { format, subDays, isAfter, parseISO } from "date-fns"
import { es } from "date-fns/locale"

function Expenses() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    amount: "",
    category: "",
  })

  // Common expense categories
  const categories = [
    "Renta",
    "Servicios",
    "Inventario",
    "Salarios",
    "Materiales",
    "Mantenimiento",
    "Publicidad",
    "Impuestos",
    "Otros",
  ]

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof Expense>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])

  // Apply filters and search
  useEffect(() => {
    if (!loading) {
      let filtered = [...expenses]

      // Apply search
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (expense) =>
            expense.description.toLowerCase().includes(lowerSearchTerm) ||
            expense.category.toLowerCase().includes(lowerSearchTerm) ||
            expense.amount.toString().includes(lowerSearchTerm),
        )
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (dateFilter === "today") {
          filtered = filtered.filter((expense) => {
            const expenseDate = new Date(expense.date)
            expenseDate.setHours(0, 0, 0, 0)
            return expenseDate.getTime() === today.getTime()
          })
        } else if (dateFilter === "week") {
          const weekAgo = subDays(today, 7)
          filtered = filtered.filter((expense) => {
            return isAfter(parseISO(expense.date), weekAgo)
          })
        } else if (dateFilter === "month") {
          const monthAgo = subDays(today, 30)
          filtered = filtered.filter((expense) => {
            return isAfter(parseISO(expense.date), monthAgo)
          })
        }
      }

      // Apply category filter
      if (categoryFilter !== "all") {
        filtered = filtered.filter((expense) => expense.category === categoryFilter)
      }

      // Apply sorting
      filtered.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        // Handle date comparison
        if (sortField === "date") {
          return sortDirection === "asc"
            ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
            : new Date(bValue as string).getTime() - new Date(aValue as string).getTime()
        }

        // Handle number comparison
        if (sortDirection === "asc") {
          return (aValue as number) - (bValue as number)
        } else {
          return (bValue as number) - (aValue as number)
        }
      })

      setFilteredExpenses(filtered)
    } else {
      setFilteredExpenses([])
    }
  }, [expenses, searchTerm, dateFilter, categoryFilter, sortField, sortDirection, loading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      amount: "",
      category: "",
    })
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (expense: Expense) => {
    setCurrentExpense(expense)
    setFormData({
      date: format(new Date(expense.date), "yyyy-MM-dd"),
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
    })
    setShowEditModal(true)
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addExpense({
        date: formData.date,
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        category: formData.category,
      })
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error("Error adding expense:", error)
    }
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentExpense) return

    try {
      await updateExpense(currentExpense.id, {
        date: formData.date,
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        category: formData.category,
      })
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      console.error("Error updating expense:", error)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este gasto?")) {
      try {
        await deleteExpense(id)
      } catch (error) {
        console.error("Error deleting expense:", error)
      }
    }
  }

  // Group expenses by date
  const groupedExpenses: { [key: string]: Expense[] } = {}
  filteredExpenses.forEach((expense) => {
    const date = expense.date
    if (!groupedExpenses[date]) {
      groupedExpenses[date] = []
    }
    groupedExpenses[date].push(expense)
  })

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  // Calculate total expenses
  const totalExpensesAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Get unique categories and count expenses per category
  const categoryCounts: { [key: string]: { count: number; amount: number } } = {}
  filteredExpenses.forEach((expense) => {
    if (!categoryCounts[expense.category]) {
      categoryCounts[expense.category] = { count: 0, amount: 0 }
    }
    categoryCounts[expense.category].count += 1
    categoryCounts[expense.category].amount += expense.amount
  })

  // Find the largest category by amount
  let largestCategory = { name: "Ninguno", amount: 0 }
  for (const [name, data] of Object.entries(categoryCounts)) {
    if (data.amount > largestCategory.amount) {
      largestCategory = { name, amount: data.amount }
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setDateFilter("all")
    setCategoryFilter("all")
    setSortDirection("desc")
    setSortField("date")
  }

  const handleSort = (field: keyof Expense) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-rose-100 rounded-lg">
            <TrendingDown className="text-rose-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
            <p className="text-sm text-gray-500">Gestiona los gastos de tu negocio</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Registrar gasto</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total gastos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalExpensesAmount.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-rose-100 rounded-full">
              <DollarSign className="h-5 w-5 text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? "gasto" : "gastos"} registrados
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Mayor categoría</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{largestCategory.name}</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-full">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ${largestCategory.amount.toFixed(2)} en {largestCategory.name.toLowerCase()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Promedio mensual</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                $
                {filteredExpenses.length > 0
                  ? (totalExpensesAmount / (Object.keys(groupedExpenses).length || 1)).toFixed(2)
                  : "0.00"}
              </p>
            </div>
            <div className="p-2 bg-teal-100 rounded-full">
              <Wallet className="h-5 w-5 text-teal-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            De {Object.keys(groupedExpenses).length} {Object.keys(groupedExpenses).length === 1 ? "día" : "días"} con
            gastos
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
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                  title="Exportar gastos"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-rose-600 hover:text-rose-800 flex items-center"
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
              <div className="w-16 h-16 border-4 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando gastos...</p>
            </div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center text-gray-500 py-8">
              <div className="p-4 bg-gray-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm || dateFilter !== "all" || categoryFilter !== "all"
                  ? "No se encontraron gastos"
                  : "No hay gastos registrados"}
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                {searchTerm || dateFilter !== "all" || categoryFilter !== "all"
                  ? "Intenta con otros términos de búsqueda o elimina los filtros aplicados."
                  : "Los gastos que registres aparecerán aquí."}
              </p>
              {(searchTerm || dateFilter !== "all" || categoryFilter !== "all") && (
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
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">
                    {groupedExpenses[date].length} {groupedExpenses[date].length === 1 ? "gasto" : "gastos"}
                  </span>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-800">
                    ${groupedExpenses[date].reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("description")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Descripción</span>
                            <ArrowUpDown size={14} className="text-gray-400" />
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("category")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Categoría</span>
                            <ArrowUpDown size={14} className="text-gray-400" />
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("amount")}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Monto</span>
                            <ArrowUpDown size={14} className="text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedExpenses[date].map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                <FileText size={18} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(expense.date), "HH:mm")}
                                  <span className="mx-1">•</span>
                                  ID: {expense.id.slice(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end text-sm font-medium text-rose-600">
                              <BadgeDollarSign className="h-4 w-4 mr-1 text-rose-500" />
                              {expense.amount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(expense)}
                                className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Editar gasto"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                title="Eliminar gasto"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredExpenses.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Mostrando {filteredExpenses.length} de {expenses.length} gastos
              </p>
              {(searchTerm || dateFilter !== "all" || categoryFilter !== "all") && (
                <button onClick={resetFilters} className="text-sm text-rose-600 hover:text-rose-800 flex items-center">
                  <X size={14} className="mr-1" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-1">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Plus className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Registrar Gasto</h3>
              </div>
              <p className="text-sm text-gray-500">Completa los detalles del nuevo gasto</p>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  placeholder="Describe el gasto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                >
                  Guardar gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-1">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Pencil className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Editar Gasto</h3>
              </div>
              <p className="text-sm text-gray-500">Actualiza los detalles del gasto</p>
            </div>
            <form onSubmit={handleUpdateExpense} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                >
                  Actualizar gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses

