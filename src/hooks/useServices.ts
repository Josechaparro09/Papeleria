//scr/hooks/useServices.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from '../types/database';
import toast from 'react-hot-toast';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar servicios');
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }

  async function addService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([service])
        .select()
        .single();

      if (error) throw error;
      setServices([...services, data]);
      toast.success('Servicio agregado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al agregar el servicio');
      throw err;
    }
  }

  async function updateService(id: string, updates: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setServices(services.map(s => s.id === id ? data : s));
      toast.success('Servicio actualizado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al actualizar el servicio');
      throw err;
    }
  }

  async function deleteService(id: string) {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setServices(services.filter(s => s.id !== id));
      toast.success('Servicio eliminado exitosamente');
    } catch (err) {
      toast.error('Error al eliminar el servicio');
      throw err;
    }
  }

  return {
    services,
    loading,
    error,
    fetchServices,
    addService,
    updateService,
    deleteService
  };
}