import { useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { LayoutDashboard, ShoppingCart, Package, Calculator, ShieldAlert, User as UserIcon, LogOut, Clover } from 'lucide-react';
import { AccountingPanel } from './AccountingPanel';
// IMPORTANTE: Adicione aqui as importações de SalesPanel, ItemsPanel, etc, que você já tem no seu arquivo original.

// COMPONENTE DE TAG (Role Badge)
const RoleBadge = ({ role }: { role: string }) => {
  const styles: any = {
    ADMIN: "bg-red-500 shadow-red-200",
    GERENTE: "bg-orange-500 shadow-orange-200",
    "SUB-LIDER": "bg-blue-500 shadow-blue-200",
    SETADOS: "bg-green-500 shadow-green-200",
    MEMBROS: "bg-gray-500 shadow-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] text-white font-black uppercase shadow-sm border border-white/20 ${styles[role?.toUpperCase()] || styles.MEMBROS}`}>
      {role || 'MEMBRO'}
    </span>
  );
};

export function Dashboard({ currentUser }: { currentUser: User }) {
  const [activeTab, setActiveTab] = useState('contabilidade');

  const handleLogout = async () => {
    // Fica offline no banco antes de sair
    await supabase.from('users').update({ is_online: false }).eq('id', currentUser.id);
    await supabase.auth.signOut();
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'contabilidade': return <AccountingPanel />;
      // Adicione seus outros cases aqui: case 'vendas': return <SalesPanel />;
      default: return <div className="p-8"><h1 className="text-2xl font-black text-gray-800">Em construção...</h1></div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* MENU LATERAL COM RELEVO */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-xl z-10 relative">
        
        {/* CABEÇALHO: FAVELA DA SORTE */}
        <div className="p-6 bg-gradient-to-br from-indigo-700 to-purple-900 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl shadow-lg border border-white/20">
              <Clover className="h-6 w-6 text-green-400 drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Favela da Sorte
              </h1>
              <p className="text-[10px] font-bold text-white/60 tracking-widest mt-1">
                PAINEL DE GESTÃO
              </p>
            </div>
          </div>
        </div>

        {/* PERFIL MODIFICADO */}
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-200 shadow-sm">
              <span className="font-black text-indigo-700 text-lg">{currentUser.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">{currentUser.username}</p>
              {/* TAG DE CARGO APLICADA */}
              <RoleBadge role={currentUser.role} />
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'vendas', icon: ShoppingCart, label: 'Vendas' },
            { id: 'itens', icon: Package, label: 'Itens' },
            { id: 'contabilidade', icon: Calculator, label: 'Contabilidade' },
            { id: 'admin', icon: ShieldAlert, label: 'Admin' },
            { id: 'perfil', icon: UserIcon, label: 'Perfil' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* BOTÃO DE SAIR E COPYRIGHT */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-bold transition-colors"
          >
            <LogOut className="h-5 w-5" /> Sair
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              © DuarttDan
            </p>
            <p className="text-[8px] font-bold text-gray-300 uppercase">
              Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        {renderContent()}
      </main>
    </div>
  );
}