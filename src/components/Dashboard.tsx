import { useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { 
  ShoppingCart, 
  Package, 
  Calculator, 
  ShieldAlert, 
  User as UserIcon, 
  LogOut, 
  Clover 
} from 'lucide-react';

import { AccountingPanel } from './AccountingPanel';
import { SalesPanel } from './SalesPanel';
import { ItemsPanel } from './ItemsPanel';
import { AdminPanel } from './AdminPanel';

const RoleBadge = ({ role }: { role: string }) => {
  const styles: any = {
    admin: "bg-red-600 shadow-red-200",
    setter: "bg-blue-600 shadow-blue-200",
    member: "bg-gray-600 shadow-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] text-white font-black uppercase shadow-sm border border-white/20 ${styles[role?.toLowerCase()] || styles.member}`}>
      {role || 'MEMBRO'}
    </span>
  );
};

export function Dashboard({ currentUser }: { currentUser: User }) {
  const [activeTab, setActiveTab] = useState('vendas');

  const handleLogout = async () => {
    await supabase.from('users').update({ is_online: false }).eq('id', currentUser.id);
    await supabase.auth.signOut();
    window.location.reload();
  };

  const renderContent = () => {
  switch (activeTab) {
    case 'vendas': 
      return <SalesPanel currentUser={currentUser} />;
    case 'contabilidade': 
      return <AccountingPanel />;
    case 'itens': 
      return <ItemsPanel />;
    case 'admin': 
      return <AdminPanel currentUser={currentUser} />;
    default: 
      // Se cair aqui, ele mostra a mensagem de erro. 
      // Mude para o painel de vendas para garantir que sempre mostre algo.
      return <SalesPanel currentUser={currentUser} />;
  }
};

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-2xl z-10">
        <div className="p-6 bg-gradient-to-br from-indigo-800 to-purple-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <Clover className="h-6 w-6 text-green-400" />
            </div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">Favela da Sorte</h1>
          </div>
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
          <button onClick={() => setActiveTab('vendas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold ${activeTab === 'vendas' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>
            <ShoppingCart className="h-5 w-5" /> Vendas
          </button>
          <button onClick={() => setActiveTab('contabilidade')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold ${activeTab === 'contabilidade' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>
            <Calculator className="h-5 w-5" /> Financeiro
          </button>
          <button onClick={() => setActiveTab('itens')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold ${activeTab === 'itens' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>
            <Package className="h-5 w-5" /> Itens
          </button>
          
          {(currentUser.role === 'admin' || currentUser.role === 'setter') && (
            <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>
              <ShieldAlert className="h-5 w-5" /> Gestão
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all">
            <LogOut className="h-5 w-5" /> Sair
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
}