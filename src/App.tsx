import { useState, useEffect } from 'react';
import { supabase, checkAuth, User } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const authUser = await checkAuth();
      
      if (authUser) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle(); // Usar maybeSingle() ao invés de single()

        if (userError) {
          console.error('Erro ao buscar usuário:', userError);
          setError('Erro ao carregar dados do usuário');
        } else if (userData) {
          setCurrentUser(userData);
          
          // Marca como online
          await supabase
            .from('users')
            .update({ is_online: true })
            .eq('id', userData.id);
          
          console.log('Usuário marcado como online');
        } else {
          // Usuário autenticado mas não existe na tabela users
          console.log('Usuário não encontrado na tabela, criando...');
          
          // Criar registro do usuário
          const username = authUser.email?.split('@')[0] || 'user';
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              username: username,
              role: 'membro',
              is_online: true,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Erro ao criar usuário:', insertError);
            setError('Erro ao criar registro do usuário');
          } else if (newUser) {
            setCurrentUser(newUser);
            console.log('Usuário criado com sucesso');
          }
        }
      }
    } catch (error) {
      console.error('Erro na inicialização:', error);
      setError('Erro ao carregar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Marca offline ao sair
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser) {
        await supabase
          .from('users')
          .update({ is_online: false })
          .eq('id', currentUser.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-white mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-4 border-white/10 mx-auto"></div>
          </div>
          <p className="text-white text-xl font-black mt-6 animate-pulse">
            Carregando Sistema...
          </p>
          <p className="text-white/60 text-sm mt-2">
            Favela da Sorte - Sistema Empresarial
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">Erro ao Carregar</h2>
          <p className="text-red-600 font-medium mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            Tentar Novamente
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
