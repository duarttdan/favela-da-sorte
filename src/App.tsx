import { useState, useEffect } from 'react';
import { supabase, checkAuth, User } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  // SISTEMA ANTI-BUG: Marca offline ao fechar a aba
  useEffect(() => {
    const handleTabClose = () => {
      if (currentUser) {
        supabase.from('users').update({ is_online: false }).eq('id', currentUser.id);
      }
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, [currentUser]);

  const checkUserSession = async () => {
    try {
      const authUser = await checkAuth();
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          setCurrentUser(userData);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    await checkUserSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-black animate-pulse">Carregando Favela da Sorte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? (
        <Dashboard currentUser={currentUser} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}