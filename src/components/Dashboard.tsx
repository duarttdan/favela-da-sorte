import { useState, useCallback } from 'react';
import { supabase, User } from '../lib/supabase';
import { 
  ShoppingCart, 
  Package, 
  Calculator, 
  ShieldAlert, 
  User as UserIcon, 
  LogOut, 
  Clover,
  Menu,
  X,
  Home,
  FileText,
  Target,
  Bell,
  Settings
} from 'lucide-react';

import { DashboardHome } from './DashboardHome';
import { AccountingPanel } from './AccountingPanel';
import { SalesPanelMulti } from './SalesPanelMulti';
import { ItemsPanel } from './ItemsPanel';
import { AdminPanel } from './AdminPanel';
import { ReportsPanel } from './ReportsPanel';
import { GoalsPanel } from './GoalsPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { SettingsPanel } from './SettingsPanel';

const RoleBadge = ({ role }: { role: string }) => {
  const styles: Record<string, string> = {
    admin: "bg-red-600 shadow-red-200",
    setter: "bg-blue-600 shadow-blue-200",
    member: "bg-gray-600 shadow-gray-200",
  };
  
  const roleLabels: Record<string, string> = {
    admin: "ADMIN",
    setter: "SETTER",
    member: "MEMBRO",
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] text-white font-black uppercase shadow-sm border border-white/20 ${styles[role?.toLowerCase()] || styles.member}`}>
      {roleLabels[role?.toLowerCase()] || 'MEMBRO'}
    </span>
  );
};

interface DashboardProps {
  currentUser: User;
  onUserUpdate?: (user: User) => void;
}

export function Dashboard({ currentUser, onUserUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    try {
      await supabase
        .from('users')
        .update({ is_online: false })
        .eq('id', currentUser.id);
      
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setLoggingOut(false);
    }
  }, [currentUser.id, loggingOut]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome currentUser={currentUser} />;
      case 'vendas': 
        return <SalesPanelMulti currentUser={currentUser} />;
      case 'contabilidade': 
        return <AccountingPanel />;
      case 'itens': 
        return <ItemsPanel />;
      case 'relatorios':
        return <ReportsPanel currentUser={currentUser} />;
      case 'metas':
        return <GoalsPanel currentUser={currentUser} />;
      case 'notificacoes':
        return <NotificationsPanel currentUser={currentUser} />;
      case 'configuracoes':
        return <SettingsPanel currentUser={currentUser} />;
      case 'admin': 
        return <AdminPanel currentUser={currentUser} />;
      default: 
        return <DashboardHome currentUser={currentUser} />;
    }
  }, [activeTab, currentUser]);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home, show: true },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart, show: true },
    { id: 'itens', label: 'Itens', icon: Package, show: true },
    { id: 'metas', label: 'Metas', icon: Target, show: true },
    { id: 'relatorios', label: 'Relatórios', icon: FileText, show: true },
    { id: 'notificacoes', label: 'Notificações', icon: Bell, show: true },
    { id: 'contabilidade', label: 'Financeiro', icon: Calculator, show: currentUser.role === 'admin' || currentUser.role === 'setter' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, show: currentUser.role === 'admin' },
    { 
      id: 'admin', 
      label: 'Gestão', 
      icon: ShieldAlert, 
      show: currentUser.role === 'admin' || currentUser.role === 'setter' 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col shadow-2xl z-10">
        <div className="p-6 bg-gradient-to-br from-indigo-800 to-purple-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <Clover className="h-6 w-6 text-green-400" />
            </div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">
              Favela da Sorte
            </h1>
          </div>
        </div>

        <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
          <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-800 truncate">
              {currentUser.username}
            </p>
            <RoleBadge role={currentUser.role} />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.filter(item => item.show).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 bg-gradient-to-br from-indigo-800 to-purple-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <Clover className="h-6 w-6 text-green-400" />
              </div>
              <h1 className="text-lg font-black text-white uppercase tracking-tighter">
                Favela da Sorte
              </h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
            <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">{currentUser.username}</p>
              <RoleBadge role={currentUser.role} />
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.filter(item => item.show).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Clover className="h-5 w-5 text-green-600" />
            <h1 className="font-black text-gray-800 uppercase text-sm tracking-tighter">
              Favela da Sorte
            </h1>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}