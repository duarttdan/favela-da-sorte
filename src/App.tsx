import { useState, useEffect } from 'react';
import { supabase, checkAuth, User } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

// Componente App Principal - Sistema de Gestão de Vendas
export function App() {
  // Estados principais da aplicação
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito para verificar autenticação ao carregar a aplicação
  useEffect(() => {
    checkUserSession();
  }, []);

  // Função para verificar se há um usuário autenticado
  const checkUserSession = async () => {
    try {
      // Verifica autenticação no Supabase
      const authUser = await checkAuth();
      
      if (authUser) {
        // Busca dados completos do usuário no banco
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

  // Função chamada após sucesso na autenticação
  const handleAuthSuccess = async () => {
    await checkUserSession();
  };

  // Exibe tela de loading inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderiza interface baseado no estado de autenticação
  return (
    <div className="min-h-screen bg-gray-100">
      {currentUser ? (
        // Se autenticado, mostra o Dashboard
        <Dashboard currentUser={currentUser} />
      ) : (
        // Se não autenticado, mostra a tela de Login/Registro
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
