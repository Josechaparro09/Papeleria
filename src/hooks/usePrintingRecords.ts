//scr/hooks/usePrintingRecords.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PrintingRecord } from '../types/database';
import toast from 'react-hot-toast';

export function usePrintingRecords() {
  const [records, setRecords] = useState<PrintingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('printing_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar registros');
      toast.error('Error al cargar registros de impresión');
    } finally {
      setLoading(false);
    }
  }

  async function addRecord(record: Omit<PrintingRecord, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('printing_records')
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      setRecords([data, ...records]);
      toast.success('Registro agregado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al agregar el registro');
      throw err;
    }
  }

  async function updateRecord(id: string, updates: Partial<PrintingRecord>) {
    try {
      const { data, error } = await supabase
        .from('printing_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setRecords(records.map(r => r.id === id ? data : r));
      toast.success('Registro actualizado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al actualizar el registro');
      throw err;
    }
  }

  async function deleteRecord(id: string) {
    try {
      const { error } = await supabase
        .from('printing_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecords(records.filter(r => r.id !== id));
      toast.success('Registro eliminado exitosamente');
    } catch (err) {
      toast.error('Error al eliminar el registro');
      throw err;
    }
  }

  return {
    records,
    loading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord
  };
}