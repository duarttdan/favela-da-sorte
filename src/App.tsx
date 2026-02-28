import { useState, useEffect } from 'react';
import { supabase, checkAuth, User } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setError(null);
        const authUser = await checkAuth();
        
        if (authUser) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (userError) {
            console.error('Erro ao buscar usuário:', userError);
            throw userError;
          }
          
          if (userData) {
            setCurrentUser(userData);
            // Marca usuário como online
            await supabase
              .from('users')
              .update({ is_online: true })
              .eq('id', userData.id);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setError('Erro ao carregar sessão. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // Sistema anti-bug: Marca offline ao fechar a aba
  useEffect(() => {
    const handleTabClose = async () => {
      if (currentUser) {
        await supabase
          .from('users')
          .update({ is_online: false })
          .eq('id', currentUser.id);
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, [currentUser]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          // Recarregar dados do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setCurrentUser(userData);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-white/10 mx-auto"></div>
          </div>
          <p className="text-white text-lg font-black animate-pulse tracking-wider">
            Carregando Favela da Sorte...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? (
        <Dashboard currentUser={currentUser} onUserUpdate={setCurrentUser} />
      ) : (
        <Auth onAuthSuccess={() => window.location.reload()} />
      )}
    </div>
  );
}