import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean; // Añadimos un estado de carga para manejar la inicialización
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Estado de carga inicial

  useEffect(() => {
    // Recuperar sesión al cargar la página (persistencia)
    const getInitialSession = async () => {
      try {
        setLoading(true);
        
        // Verificar si hay una sesión activa guardada
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          console.log('Sesión recuperada', data.session);
        }
      } catch (error) {
        console.error('Error al recuperar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Configurar el listener para cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Establecer explícitamente la sesión y el usuario al iniciar sesión
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
      
    } catch (error: any) {
      toast.error('Error al iniciar sesión: ' + error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar explícitamente al cerrar sesión
      setSession(null);
      setUser(null);
      
    } catch (error: any) {
      toast.error('Error al cerrar sesión: ' + error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}