import React, { useState, useEffect } from 'react';
import { Receipt, Plus, AlertCircle, Trash2, X, FileText, ShoppingCart, Wrench } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useServices } from '../hooks/useServices';
import { Sale, SaleItem, Product, Service } from '../types/database';
import { format } from 'date-fns';

function Sales() {
  const { sales, loading, addSale, deleteSale } = useSales();
  const { products } = useProducts();
  const { services } = useServices();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [saleType, setSaleType] = useState<'product' | 'service'>('product');
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saleItems, setSaleItems] = useState<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[]>([]);

  const [itemForm, setItemForm] = useState({
    itemId: '',
    quantity: 1
  });

  // Reset form when changing sale type
  useEffect(() => {
    setSaleItems([]);
    setItemForm({ itemId: '', quantity: 1 });
  }, [saleType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItemForm({ ...itemForm, [name]: value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaleDate(e.target.value);
  };

  const handleTypeChange = (type: 'product' | 'service') => {
    setSaleType(type);
  };

  const addItem = () => {
    if (!itemForm.itemId || itemForm.quantity <= 0) return;

    let itemToAdd;
    if (saleType === 'product') {
      const product = products.find(p => p.id === itemForm.itemId);
      if (!product) return;

      itemToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: Number(itemForm.quantity)
      };
    } else {
      const service = services.find(s => s.id === itemForm.itemId);
      if (!service) return;

      itemToAdd = {
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: Number(itemForm.quantity)
      };
    }

    // Check if item already exists in the list
    const existingItemIndex = saleItems.findIndex(item => item.id === itemToAdd.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex].quantity += Number(itemForm.quantity);
      setSaleItems(updatedItems);
    } else {
      // Add new item
      setSaleItems([...saleItems, itemToAdd]);
    }

    // Reset item form
    setItemForm({ itemId: '', quantity: 1 });
  };

  const removeItem = (index: number) => {
    const newItems = [...saleItems];
    newItems.splice(index, 1);
    setSaleItems(newItems);
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleAddSale = async () => {
    if (saleItems.length === 0) return;

    const total = calculateTotal();
    
    try {
      const saleData: Omit<Sale, 'id' | 'created_at'> = {
        date: saleDate,
        total,
        type: saleType,
        items: [],
        updated_at: ''
      };

      const saleItemsData = saleItems.map(item => {
        const itemData: Partial<SaleItem> = {
          quantity: item.quantity,
          price: item.price
        };

        if (saleType === 'product') {
          itemData.product_id = item.id;
        } else {
          itemData.service_id = item.id;
        }

        return itemData as Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>;
      });

      await addSale(saleData, saleItemsData);
      
      // Reset form and close modal
      setSaleDate(format(new Date(), 'yyyy-MM-dd'));
      setSaleType('product');
      setSaleItems([]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding sale:', error);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      try {
        await deleteSale(id);
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const viewSaleDetails = (sale: Sale) => {
    setCurrentSale(sale);
    setShowViewModal(true);
  };

  // Group sales by date
  const groupedSales: { [key: string]: Sale[] } = {};
  sales.forEach(sale => {
    const date = sale.date;
    if (!groupedSales[date]) {
      groupedSales[date] = [];
    }
    groupedSales[date].push(sale);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedSales).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Helper function to find product or service name
  const getItemName = (item: SaleItem) => {
    if (item.product_id) {
      const product = products.find(p => p.id === item.product_id);
      return product ? product.name : 'Producto desconocido';
    } else if (item.service_id) {
      const service = services.find(s => s.id === item.service_id);
      return service ? service.name : 'Servicio desconocido';
    }
    return 'Desconocido';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Receipt className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nueva venta</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-6 text-center">Cargando ventas...</div>
        ) : sales.length === 0 ? (
          <div className="p-6">
            <div className="flex items-center justify-center text-gray-500 py-8">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas registradas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Las ventas que registres aparecerán aquí
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {sortedDates.map(date => (
              <div key={date} className="border-b border-gray-100 last:border-b-0">
                <div className="px-6 py-3 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700">
                    {format(new Date(date), 'dd/MM/yyyy')}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedSales[date].map((sale) => (
                    <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            {sale.type === 'product' ? (
                              <ShoppingCart size={18} className="text-blue-500" />
                            ) : (
                              <Wrench size={18} className="text-green-500" />
                            )}
                            <span className="font-medium">
                              {sale.type === 'product' ? 'Venta de productos' : 'Venta de servicios'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {sale.items?.length || 0} {sale.type === 'product' ? 'productos' : 'servicios'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">${sale.total.toFixed(2)}</p>
                          <div className="flex mt-2 space-x-2">
                            <button
                              onClick={() => viewSaleDetails(sale)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSale(sale.id)}
                              className="text-red-600 hover:text-red-800"
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
      </div>

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Nueva Venta</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de venta</label>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('product')}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
                        saleType === 'product'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      Productos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('service')}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-t border-r border-b ${
                        saleType === 'service'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      Servicios
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4">
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {saleType === 'product' ? 'Producto' : 'Servicio'}
                    </label>
                    <select
                      name="itemId"
                      value={itemForm.itemId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Seleccionar {saleType === 'product' ? 'producto' : 'servicio'}</option>
                      {saleType === 'product' ? (
                        products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price.toFixed(2)}
                          </option>
                        ))
                      ) : (
                        services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} - ${service.price.toFixed(2)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="w-1/4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      name="quantity"
                      value={itemForm.quantity}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Sale items list */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Artículos</h4>
                  {saleItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay artículos agregados</p>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {saleType === 'product' ? 'Producto' : 'Servicio'}
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
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ${item.price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                ${(item.price * item.quantity).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              Total:
                            </td>
                            <td className="px-6 py-3 text-right text-sm font-medium text-blue-600">
                              ${calculateTotal().toFixed(2)}
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddSale}
                  disabled={saleItems.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Detalles de Venta</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{format(new Date(currentSale.date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">
                    {currentSale.type === 'product' ? 'Venta de productos' : 'Venta de servicios'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-blue-600">${currentSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Artículos</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {currentSale.type === 'product' ? 'Producto' : 'Servicio'}
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
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getItemName(item)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;