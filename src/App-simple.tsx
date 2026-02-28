import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { SalesPanel } from './components/SalesPanel';

export function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData) {
          setCurrentUser(userData);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
          <p className="text-white text-lg font-black">Carregando...</p>
          <p className="text-white/60 text-sm mt-2">Se demorar muito, pressione F12 e veja o Console</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? (
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-800">Olá, {currentUser.username}!</h1>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
            >
              Sair
            </button>
          </div>
          <SalesPanel currentUser={currentUser} />
        </div>
      ) : (
        <Auth onAuthSuccess={checkUser} />
      )}
    </div>
  );
}
