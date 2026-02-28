import { useState, useEffect, useCallback } from 'react';
import { supabase, User as SupabaseUser } from '../lib/supabase';
import { Users, UserPlus, Trash2, Mail, AlertCircle, CheckCircle, X, ArrowUp } from 'lucide-react';

const RoleBadge = ({ role }: { role: string }) => {
  const styles: Record<string, string> = {
    dono: "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-200",
    gerente: "bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-200",
    'sub-lider': "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-200",
    admin: "bg-gradient-to-r from-red-600 to-rose-600 shadow-red-200",
    setter: "bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-200",
    membro: "bg-gradient-to-r from-gray-600 to-slate-600 shadow-gray-200",
    member: "bg-gradient-to-r from-gray-600 to-slate-600 shadow-gray-200",
  };
  
  const roleLabels: Record<string, string> = {
    dono: "👑 DONO",
    gerente: "💼 GERENTE",
    'sub-lider': "⭐ SUB-LÍDER",
    admin: "🔴 ADMIN",
    setter: "🔵 SETTER",
    membro: "👤 MEMBRO",
    member: "👤 MEMBRO",
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] text-white font-black uppercase shadow-lg border border-white/30 ${styles[role?.toLowerCase()] || styles.member}`}>
      {roleLabels[role?.toLowerCase()] || '👤 MEMBRO'}
    </span>
  );
};

export function AdminPanel({ currentUser }: { currentUser: SupabaseUser }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('membro');
  const [newRole, setNewRole] = useState('membro');

  // Hierarquia de cargos (maior número = mais poder)
  const roleHierarchy: Record<string, number> = {
    'dono': 5,
    'gerente': 4,
    'sub-lider': 3,
    'admin': 2,
    'membro': 1,
  };

  const canManageUser = (targetRole: string) => {
    return roleHierarchy[currentUser.role] > roleHierarchy[targetRole];
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true });
      
      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar lista de usuários');
    }
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Email inválido');
      }

      const username = email.split('@')[0];
      const tempPassword = `Senha${Math.random().toString(36).slice(-6)}!`; // Senha temporária

      // Criar usuário no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (authError) {
        if (authError.message.includes('already')) {
          throw new Error('Este email já está cadastrado');
        }
        throw authError;
      }

      if (authData.user) {
        // Criar registro na tabela users
        const { error: insertError } = await supabase.from('users').insert([
          { 
            id: authData.user.id,
            email: email.trim().toLowerCase(), 
            role: role.toLowerCase(), 
            username: username,
            is_online: false 
          }
        ]);

        if (insertError) throw insertError;

        setSuccess(`✅ Usuário criado!\n📧 Email: ${email}\n🔑 Senha: ${tempPassword}\n\n⚠️ COPIE ESTA SENHA AGORA!`);
        setEmail('');
        setRole('member');
        await loadUsers();
        
        // Não fechar o modal para copiar a senha
        setTimeout(() => {
          if (confirm('Você copiou a senha? Clique OK para fechar.')) {
            setShowCreateModal(false);
            setSuccess(null);
          }
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string, userRole: string) => {
    if (id === currentUser.id) {
      setError('Você não pode excluir a si mesmo!');
      return;
    }

    if (!canManageUser(userRole)) {
      setError('Você não tem permissão para remover este usuário!');
      return;
    }
    
    if (!confirm(`Tem certeza que deseja remover "${username}" da equipe?`)) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      
      setSuccess(`Usuário "${username}" removido com sucesso!`);
      await loadUsers();
    } catch (error: any) {
      setError(error.message || 'Erro ao deletar usuário');
    }
  };

  const handlePromoteUser = (user: any) => {
    if (!canManageUser(user.role)) {
      setError('Você não tem permissão para promover este usuário!');
      return;
    }
    setSelectedUser(user);
    setNewRole(user.role);
    setShowPromoteModal(true);
    setError(null);
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    if (!canManageUser(selectedUser.role) || !canManageUser(newRole)) {
      setError('Você não pode promover usuários para um cargo igual ou superior ao seu!');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setSuccess(`${selectedUser.username} agora é ${newRole.toUpperCase()}!`);
      setShowPromoteModal(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      setError(error.message || 'Erro ao alterar cargo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter uppercase italic">
            Painel Administrativo
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Gestão de Equipe
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:scale-105 transition-all"
        >
          <UserPlus size={18} />
          <span>Criar Usuário</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          <h3 className="font-black text-gray-700 uppercase text-sm tracking-tighter">
            Usuários do Sistema ({users.length})
          </h3>
        </div>

        <div className="p-4 md:p-6">
          {users.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold">
              Nenhum usuário cadastrado
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all group gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black border-2 border-white shadow-sm flex-shrink-0">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 truncate">
                        {user.username}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                        <Mail size={10} />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    <RoleBadge role={user.role} />
                    {user.id !== currentUser.id && canManageUser(user.role) && (
                      <>
                        <button 
                          onClick={() => handlePromoteUser(user)}
                          className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                          title="Alterar cargo"
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                          title="Remover usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                <UserPlus className="text-indigo-600" />
                <span>Criar Novo Usuário</span>
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                  E-mail do Membro
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@gmail.com"
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                  Cargo / Função
                </label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold transition-all"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="membro">👤 Membro (Vendedor)</option>
                  {roleHierarchy[currentUser.role] >= 2 && <option value="admin">🔴 Admin</option>}
                  {roleHierarchy[currentUser.role] >= 3 && <option value="sub-lider">⭐ Sub-Líder</option>}
                  {roleHierarchy[currentUser.role] >= 4 && <option value="gerente">💼 Gerente</option>}
                  {roleHierarchy[currentUser.role] >= 5 && <option value="dono">👑 Dono</option>}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError(null);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Promoção/Rebaixamento */}
      {showPromoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                <ArrowUp className="text-indigo-600" />
                <span>Alterar Cargo</span>
              </h3>
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                  setError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black">
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-gray-800">{selectedUser.username}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-400 uppercase font-bold">Cargo Atual:</span>
                <div className="mt-1">
                  <RoleBadge role={selectedUser.role} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                  Novo Cargo
                </label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold transition-all"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="membro">👤 Membro (Vendedor)</option>
                  {roleHierarchy[currentUser.role] >= 2 && <option value="admin">🔴 Admin</option>}
                  {roleHierarchy[currentUser.role] >= 3 && <option value="sub-lider">⭐ Sub-Líder</option>}
                  {roleHierarchy[currentUser.role] >= 4 && <option value="gerente">💼 Gerente</option>}
                  {roleHierarchy[currentUser.role] >= 5 && <option value="dono">👑 Dono</option>}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowPromoteModal(false);
                    setSelectedUser(null);
                    setError(null);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleChangeRole}
                  disabled={loading || newRole === selectedUser.role}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Alterando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}