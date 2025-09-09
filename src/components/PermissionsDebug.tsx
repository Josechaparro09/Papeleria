import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';

const PermissionsDebug = () => {
  const { user } = useAuth();
  const { permissions, loading, canAccessModule, getUserRole } = usePermissions(user?.id);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-600">Cargando permisos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Debug de Permisos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Información del Usuario</h4>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Rol:</strong> {getUserRole()}</p>
          <p><strong>ID:</strong> {user?.id}</p>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Módulos Disponibles</h4>
          <div className="space-y-1">
            {permissions.modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between text-sm">
                <span>{module.display_name}</span>
                <span className="text-green-600">✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Pruebas de Acceso</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {['dashboard', 'products', 'sales', 'expenses', 'printing', 'services', 'recharges', 'history'].map((module) => (
            <div key={module} className="text-center p-2 border rounded">
              <div className="font-medium">{module}</div>
              <div className={canAccessModule(module) ? 'text-green-600' : 'text-red-600'}>
                {canAccessModule(module) ? 'Acceso ✓' : 'Sin acceso ✗'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionsDebug;
