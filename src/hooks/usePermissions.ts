import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Role, Module } from '../types/database';
import toast from 'react-hot-toast';

export interface UserPermissions {
  modules: Module[];
  permissions: Record<string, {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>;
  userRole: Role | null;
}

export function usePermissions(userId?: string) {
  const [permissions, setPermissions] = useState<UserPermissions>({
    modules: [],
    permissions: {},
    userRole: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserPermissions(userId);
    } else {
      setLoading(false);
    }
  }, [userId]);

  async function fetchUserPermissions(userId: string) {
    try {
      setLoading(true);
      
      // Obtener el perfil del usuario con su rol
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Error fetching user profile:', profileError);
        // Si no hay perfil, crear uno por defecto
        const { data: defaultRole } = await supabase
          .from('roles')
          .select('*')
          .eq('name', 'user')
          .single();
        
        setPermissions({
          modules: [],
          permissions: {},
          userRole: defaultRole
        });
        return;
      }

      const userRole = userProfile?.role;

      // Obtener todos los módulos disponibles
      const { data: allModules, error: modulesError } = await supabase
        .from('app_modules')
        .select('*')
        .order('module_name');

      if (modulesError) throw modulesError;

      // Obtener permisos del rol del usuario
      const { data: rolePermissions, error: permissionsError } = await supabase
        .from('role_module_permissions')
        .select(`
          *,
          module:app_modules(*)
        `)
        .eq('role_id', userRole?.id);

      if (permissionsError) throw permissionsError;

      // Construir el objeto de permisos
      const permissionsMap: Record<string, {
        can_view: boolean;
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
      }> = {};

      const allowedModules: Module[] = [];

      // Inicializar todos los módulos como no accesibles
      allModules?.forEach((module) => {
        permissionsMap[module.module_name] = {
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        };
      });

      // Aplicar permisos del rol
      rolePermissions?.forEach((rp: any) => {
        if (rp.module) {
          permissionsMap[rp.module_name] = {
            can_view: true, // Si está en la tabla, tiene acceso básico
            can_create: true, // Por ahora, todos los permisos son true
            can_edit: true,
            can_delete: true
          };

          allowedModules.push({
            id: rp.module.id.toString(),
            name: rp.module.module_name,
            display_name: rp.module.module_display,
            description: rp.module.description,
            icon: 'Package', // Icono por defecto
            route: `/${rp.module.module_name}`,
            order_index: 0,
            is_active: true,
            created_at: rp.module.created_at || new Date().toISOString(),
            updated_at: rp.module.created_at || new Date().toISOString()
          });
        }
      });

      setPermissions({
        modules: allowedModules.sort((a, b) => a.name.localeCompare(b.name)),
        permissions: permissionsMap,
        userRole: userRole
      });

    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar permisos';
      
      console.error('Fetch Permissions Error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Función para verificar si el usuario puede acceder a un módulo
  const canAccessModule = (moduleName: string): boolean => {
    return permissions.permissions[moduleName]?.can_view || false;
  };

  // Función para verificar permisos específicos
  const hasPermission = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    const modulePermissions = permissions.permissions[moduleName];
    if (!modulePermissions) return false;

    switch (action) {
      case 'view':
        return modulePermissions.can_view;
      case 'create':
        return modulePermissions.can_create;
      case 'edit':
        return modulePermissions.can_edit;
      case 'delete':
        return modulePermissions.can_delete;
      default:
        return false;
    }
  };

  // Función para obtener el rol del usuario
  const getUserRole = (): string => {
    return permissions.userRole?.name || 'user';
  };

  return {
    permissions,
    loading,
    error,
    canAccessModule,
    hasPermission,
    getUserRole,
    refetch: () => userId ? fetchUserPermissions(userId) : Promise.resolve()
  };
}
