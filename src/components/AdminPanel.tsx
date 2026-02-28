import { useState, useEffect } from 'react';
import { supabase, User as SupabaseUser } from '../lib/supabase';
import { Users, UserPlus, Trash2, ShieldCheck, Mail, User as UserIcon } from 'lucide-react';

// Reutilizando o RoleBadge que criamos para o Dashboard
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

export function AdminPanel({ currentUser }: { currentUser: SupabaseUser }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estados para o novo usuário
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username', { ascending: true });
    
    if (data) setUsers(data);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // O segredo está em inserir com o role em minúsculo para bater com o banco
      const { error } = await supabase.from('users').insert([
        { 
          email: email.toLowerCase(), 
          role: role.toLowerCase(), 
          username: email.split('@')[0],
          is_online: false 
        }
      ]);

      if (error) throw error;

      alert("Perfil criado! Lembre-se: O usuário deve se cadastrar com este e-mail para acessar.");
      setEmail('');
      setShowCreateModal(false);
      loadUsers();
    } catch (error: any) {
      alert("Erro ao criar usuário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser.id) return alert("Você não pode excluir a si mesmo!");
    
    if (confirm("Tem certeza que deseja remover este membro da equipe?")) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (!error) loadUsers();
      else alert("Erro ao deletar: " + error.message);
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">
            Painel Administrativo
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Gestão de Equipe</p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-200 hover:scale-105 transition-all"
        >
          <UserPlus size={18} /> Criar Usuário
        </button>
      </div>

      {/* LISTA DE USUÁRIOS */}
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          <h3 className="font-black text-gray-700 uppercase text-sm tracking-tighter">Usuários do Sistema</h3>
        </div>

        <div className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold">Carregando membros...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black border-2 border-white shadow-sm">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-black text-gray-800">{user.username}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                        <Mail size={10} /> {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <RoleBadge role={user.role} />
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO (SISTEMA OVERLAY) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <UserPlus className="text-indigo-600" /> Criar Novo Usuário
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">E-mail do Membro</label>
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@gmail.com"
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Cargo / Função</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="member">Membro (Vendedor)</option>
                  <option value="setter">Setado (Sub-Líder)</option>
                  <option value="admin">Administrador (Dono)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  {loading ? 'Criando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}