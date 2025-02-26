"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Wrench,
  Plus,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Search,
  DollarSign,
  FileText,
  ArrowUpDown,
  Tag,
} from "lucide-react"
import { useServices } from "../hooks/useServices"
import type { Service } from "../types/database"

function Services() {
  const { services, loading, addService, updateService, deleteService } = useServices()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentService, setCurrentService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  })

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Service>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filteredServices, setFilteredServices] = useState<Service[]>([])

  // Apply filters and search
  useEffect(() => {
    if (!loading && services.length > 0) {
      let result = [...services]

      // Apply search
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        result = result.filter(
          (service) =>
            service.name.toLowerCase().includes(lowerSearchTerm) ||
            (service.description && service.description.toLowerCase().includes(lowerSearchTerm)),
        )
      }

      // Apply sorting
      result.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        // Handle number comparison
        if (sortDirection === "asc") {
          return (aValue as number) - (bValue as number)
        } else {
          return (bValue as number) - (aValue as number)
        }
      })

      setFilteredServices(result)
    } else {
      setFilteredServices([])
    }
  }, [services, searchTerm, sortField, sortDirection, loading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
    })
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (service: Service) => {
    setCurrentService(service)
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
    })
    setShowEditModal(true)
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addService({
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
      })
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error("Error adding service:", error)
    }
  }

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentService) return

    try {
      await updateService(currentService.id, {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
      })
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      console.error("Error updating service:", error)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este servicio?")) {
      try {
        await deleteService(id)
      } catch (error) {
        console.error("Error deleting service:", error)
      }
    }
  }

  const handleSort = (field: keyof Service) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Calculate total value of services
  const totalServicesValue = filteredServices.reduce((sum, service) => sum + service.price, 0)

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Wrench className="text-purple-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
            <p className="text-sm text-gray-500">Gestiona los servicios que ofreces</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Nuevo servicio</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total servicios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredServices.length}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Wrench className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredServices.length === 1 ? "Servicio registrado" : "Servicios registrados"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Precio promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${filteredServices.length > 0 ? (totalServicesValue / filteredServices.length).toFixed(2) : "0.00"}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Precio promedio de los servicios</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Valor total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalServicesValue.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Suma de todos los servicios</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando servicios...</p>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center text-gray-500 py-8">
              <div className="p-4 bg-gray-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm ? "No se encontraron servicios" : "No hay servicios registrados"}
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                {searchTerm ? "Intenta con otros términos de búsqueda." : "Los servicios que agregues aparecerán aquí."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nombre</span>
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Descripción</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Precio</span>
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                          <Tag size={18} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-500">ID: {service.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{service.description || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        {service.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(service)}
                          className="p-1 rounded-md text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Editar servicio"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar servicio"
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
        )}

        {!loading && filteredServices.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Mostrando {filteredServices.length} de {services.length} servicios
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Plus className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Agregar Servicio</h3>
              </div>
              <p className="text-sm text-gray-500">Completa los detalles del nuevo servicio</p>
            </div>
            <form onSubmit={handleAddService} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  placeholder="Nombre del servicio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  placeholder="Descripción del servicio (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Guardar servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Pencil className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Editar Servicio</h3>
              </div>
              <p className="text-sm text-gray-500">Actualiza los detalles del servicio</p>
            </div>
            <form onSubmit={handleUpdateService} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Actualizar servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Services

