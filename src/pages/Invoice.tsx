import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Building2, Phone, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useServices } from '../hooks/useServices';
import type { Sale, SaleItem } from '../types/database';
import formatMoney from '../utils/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Invoice = () => {
  const navigate = useNavigate();
  const { saleId } = useParams();
  const { getSaleById } = useSales();
  const { products } = useProducts();
  const { services } = useServices();
  const [sale, setSale] = useState<Sale | null>(null);
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  useEffect(() => {
    const loadSale = async () => {
      if (saleId) {
        const saleData = await getSaleById(saleId);
        setSale(saleData);
      }
    };
    loadSale();
  }, [saleId, getSaleById]);

  const getItemName = (item: SaleItem) => {
    if (item.product_id) {
      const product = products.find(p => p.id === item.product_id);
      return product ? product.name : 'Producto no encontrado';
    } else if (item.service_id) {
      const service = services.find(s => s.id === item.service_id);
      return service ? service.name : 'Servicio no encontrado';
    }
    return 'Item no encontrado';
  };

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Botones de acción */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver
        </button>
        <button
          onClick={() => handlePrint()}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Printer className="w-5 h-5 mr-2" />
          Imprimir Factura
        </button>
      </div>

      {/* Contenido de la factura */}
      <div className="max-w-4xl mx-auto">
        <div ref={componentRef} className="bg-white rounded-xl shadow-lg p-4 h-[277mm] flex flex-col">
          {/* Encabezado */}
          <div className="border-b pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PAPELERÍA XYZ</h1>
                <div className="mt-1 space-y-0.5 text-gray-600 text-sm">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span>NIT: XXX-XXX-XXX</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>[Tu dirección aquí]</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>[Tu teléfono aquí]</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">FACTURA</div>
                <div className="mt-1 text-gray-600">
                  <div className="text-sm">Factura #: {sale.id.slice(0, 8)}</div>
                  <div className="text-sm">
                    Fecha: {format(new Date(sale.date), 'PPP', { locale: es })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          {sale.customer_name && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <h2 className="text-base font-semibold text-gray-700 mb-1">Información del Cliente</h2>
              <div className="text-gray-600">
                <p className="font-medium">{sale.customer_name}</p>
              </div>
            </div>
          )}

          {/* Tabla de items */}
          <div className="mt-3">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sale.items?.map((item: SaleItem) => (
                  <tr key={item.id} className="text-gray-700">
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium">{getItemName(item)}</div>
                    </td>
                    <td className="px-3 py-2 text-right text-sm">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-sm">
                      {formatMoney(item.price)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      {formatMoney(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen y total */}
          <div className="mt-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800 font-medium">{formatMoney(sale.total)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-base font-semibold text-gray-700">Total</span>
                <span className="text-xl font-bold text-blue-600">{formatMoney(sale.total)}</span>
              </div>
              {sale.payment_method && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Método de pago</span>
                    <span className="font-medium">{sale.payment_method}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pie de página */}
          <div className="mt-auto pt-3 border-t">
            <div className="text-center text-gray-600">
              <p className="font-medium text-sm">¡Gracias por su compra!</p>
              <p className="text-xs">Este documento sirve como comprobante de pago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice; 