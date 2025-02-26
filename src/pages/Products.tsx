"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Package,
  Plus,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Search,
  ArrowUpDown,
  Tag,
  DollarSign,
  Layers,
  AlertTriangle,
} from "lucide-react"
import { useProducts } from "../hooks/useProducts"
import type { Product } from "../types/database"

function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    min_stock: "",
  })

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Product>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showLowStock, setShowLowStock] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  // Apply filters and search
  useEffect(() => {
    if (!loading && products.length > 0) {
      let result = [...products]

      // Apply search
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        result = result.filter(
          (product) =>
            product.name.toLowerCase().includes(lowerSearchTerm) ||
            (product.description && product.description.toLowerCase().includes(lowerSearchTerm)),
        )
      }

      // Apply low stock filter
      if (showLowStock) {
        result = result.filter((product) => product.stock <= product.min_stock)
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

      setFilteredProducts(result)
    } else {
      setFilteredProducts([])
    }
  }, [products, searchTerm, sortField, sortDirection, showLowStock, loading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      min_stock: "",
    })
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (product: Product) => {
    setCurrentProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
    })
    setShowEditModal(true)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
        min_stock: Number.parseInt(formData.min_stock),
      })
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProduct) return

    try {
      await updateProduct(currentProduct.id, {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
        min_stock: Number.parseInt(formData.min_stock),
      })
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteProduct(id)
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="text-blue-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-sm text-gray-500">Gestiona tus productos</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Agregar producto</span>
        </button>
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
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  showLowStock
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <AlertTriangle size={16} className={showLowStock ? "text-orange-500" : "text-gray-400"} />
                <span>Stock bajo ({lowStockCount})</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando productos...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center text-gray-500 py-8">
              <div className="p-4 bg-gray-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm || showLowStock ? "No se encontraron productos" : "No hay productos"}
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                {searchTerm || showLowStock
                  ? "Intenta con otros términos de búsqueda o elimina los filtros aplicados."
                  : "Comienza agregando productos a tu inventario para gestionar tu stock."}
              </p>
              {(searchTerm || showLowStock) && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setShowLowStock(false)
                  }}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar filtros
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
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("stock")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Stock</span>
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("min_stock")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Stock Mínimo</span>
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          <Tag size={18} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{product.description || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        {product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`flex items-center ${product.stock <= product.min_stock ? "text-red-600" : "text-gray-900"}`}
                        >
                          <Layers
                            className={`h-4 w-4 mr-1 ${product.stock <= product.min_stock ? "text-red-500" : "text-gray-400"}`}
                          />
                          <span className="text-sm font-medium">{product.stock}</span>
                        </div>
                        {product.stock <= product.min_stock && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                            Bajo stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.min_stock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar producto"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar producto"
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

        {!loading && filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Mostrando {filteredProducts.length} de {products.length} productos
              </p>
              {(searchTerm || showLowStock) && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setShowLowStock(false)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Agregar Producto</h3>
              </div>
              <p className="text-sm text-gray-500">Completa los detalles del nuevo producto</p>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Descripción del producto (opcional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Layers className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Se mostrará una alerta cuando el stock sea menor o igual a este valor
                </p>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Guardar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pencil className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Editar Producto</h3>
              </div>
              <p className="text-sm text-gray-500">Actualiza los detalles del producto</p>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Layers className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Actualizar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products

