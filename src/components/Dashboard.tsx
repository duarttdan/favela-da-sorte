import React, { useState, useEffect } from 'react';
import { supabase, User, Item, Sale, signOut } from '../lib/supabase';
import { AdminPanel } from './AdminPanel';
import { SalesPanel } from './SalesPanel';
import { ItemsPanel } from './ItemsPanel';
import { AccountingPanel } from './AccountingPanel';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Calculator, 
  LogOut, 
  UserCircle,
  Package
} from 'lucide-react';

// Interface para as props do componente Dashboard
interface DashboardProps {
  currentUser: User; // Usuário atualmente logado
}

// Tipos de painéis disponíveis no sistema
type PanelType = 'dashboard' | 'sales' | 'items' | 'accounting' | 'admin' | 'profile';

// Componente Principal do Dashboard
export function Dashboard({ currentUser }: DashboardProps) {
  // Estados para controle do dashboard
  const [activePanel, setActivePanel] = useState<PanelType>('dashboard');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);

  // Efeito para carregar dados iniciais e configurar listeners em tempo real
  useEffect(() => {
    loadDashboardData();
    setupRealtimeListeners();
    updateUserOnlineStatus(true);

    // Cleanup: marca usuário como offline ao sair
    return () => {
      updateUserOnlineStatus(false);
    };
  }, []);

  // Função para atualizar status online do usuário
  const updateUserOnlineStatus = async (isOnline: boolean) => {
    await supabase
      .from('users')
      .update({ is_online: isOnline })
      .eq('id', currentUser.id);
  };

  // Função para carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      // Carregar usuários online
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('is_online', true);
      
      if (users) setOnlineUsers(users);

      // Carregar vendas do dia
      const today = new Date().toISOString().split('T')[0];
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', `${today}T00:00:00`);

      if (sales) {
        setTodaySales(sales);
        // Calcula lucro total das vendas (80% para dono)
        const total = sales.reduce((sum, sale) => sum + sale.owner_profit, 0);
        setTotalProfit(total);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Configura listeners em tempo real para atualizações automáticas
  const setupRealtimeListeners = () => {
    // Listener para usuários online
    const userChannel = supabase
      .channel('users-online')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users' 
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    // Listener para novas vendas
    const salesChannel = supabase
      .channel('sales-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'sales' 
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    // Cleanup dos listeners
    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(salesChannel);
    };
  };

  // Função para fazer logout do sistema
  const handleLogout = async () => {
    await updateUserOnlineStatus(false);
    await signOut();
    window.location.reload(); // Recarrega a página para voltar à tela de login
  };

  // Navegação lateral do sistema
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'member', 'setter'] },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart, roles: ['admin', 'member'] },
    { id: 'items', label: 'Itens', icon: Package, roles: ['admin', 'member'] },
    { id: 'accounting', label: 'Contabilidade', icon: Calculator, roles: ['admin'] },
    { id: 'admin', label: 'Admin', icon: Users, roles: ['admin', 'setter'] },
    { id: 'profile', label: 'Perfil', icon: UserCircle, roles: ['admin', 'member', 'setter'] },
  ];

  // Filtra itens de navegação baseado na role do usuário
  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(currentUser.role)
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar de Navegação */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h1 className="text-2xl font-bold">Painel de Controle</h1>
          <p className="text-sm opacity-90 mt-1">{currentUser.username}</p>
          <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded text-xs mt-2">
            {currentUser.role}
          </span>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id as PanelType)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    activePanel === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 overflow-auto">
        {activePanel === 'dashboard' && (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h2>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Usuários Online</p>
                    <p className="text-3xl font-bold text-blue-600">{onlineUsers.length}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Vendas Hoje</p>
                    <p className="text-3xl font-bold text-green-600">{todaySales.length}</p>
                  </div>
                  <ShoppingCart className="h-10 w-10 text-green-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Seu Lucro Hoje</p>
                    <p className="text-3xl font-bold text-purple-600">
                      R$ {totalProfit.toFixed(2)}
                    </p>
                  </div>
                  <Calculator className="h-10 w-10 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Lista de Usuários Online */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Usuários Online</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-800">{user.username}</span>
                    <span className="text-xs text-gray-500">({user.role})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Renderiza painéis específicos baseado na seleção */}
        {activePanel === 'admin' && <AdminPanel currentUser={currentUser} />}
        {activePanel === 'sales' && <SalesPanel currentUser={currentUser} />}
        {activePanel === 'items' && <ItemsPanel />}
        {activePanel === 'accounting' && <AccountingPanel />}
        {activePanel === 'profile' && (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Meu Perfil</h2>
            <div className="bg-white rounded-xl shadow-md p-6 max-w-md">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário</label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-medium">
                    {currentUser.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    {currentUser.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <span className="capitalize font-medium">{currentUser.role}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}