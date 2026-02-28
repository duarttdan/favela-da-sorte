import { useState, useEffect, useCallback } from 'react';
import { supabase, User as SupabaseUser } from '../lib/supabase';
import { Users, UserPlus, Trash2, Mail, AlertCircle, CheckCircle, X, ArrowUp, ArrowDown, Crown, Shield, Star, User as UserIcon } from 'lucide-react';

const RoleBadge = ({ role }: { role: string }) => {
  const configs: Record<string, { gradient: string; shadow: string; glow: string; icon: any; label: string }> = {
    dono: {
      gradient: "from-yellow-400 via-orange-500 to-red-500",
      shadow: "shadow-yellow-500/50",
      glow: "before:bg-yellow-500/20",
      icon: Crown,
      label: "DONO"
    },
    gerente: {
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      shadow: "shadow-purple-500/50",
      glow: "before:bg-purple-500/20",
      icon: Shield,
      label: "GERENTE"
    },
    'sub-lider': {
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      shadow: "shadow-blue-500/50",
      glow: "before:bg-blue-500/20",
      icon: Star,
      label: "SUB-LÍDER"
    },
    admin: {
      gradient: "from-red-500 via-rose-500 to-pink-500",
      shadow: "shadow-red-500/50",
      glow: "before:bg-red-500/20",
      icon: Shield,
      label: "ADMIN"
    },
    membro: {
      gradient: "from-gray-500 via-slate-500 to-zinc-500",
      shadow: "shadow-gray-500/50",
      glow: "before:bg-gray-500/20",
      icon: UserIcon,
      label: "MEMBRO"
    }
  };

  const config = configs[role?.toLowerCase()] || configs.membro;
  const Icon = config.icon;

  return (
    <div className="relative inline-flex">
      <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} blur-md opacity-75 ${config.shadow} animate-pulse`}></div>
      <div className={`relative px-4 py-2 bg-gradient-to-r ${config.gradient} rounded-xl shadow-lg ${config.shadow} border border-white/20 backdrop-blur-sm`}>
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-white drop-shadow-lg" />
          <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow-lg">
            {config.label}
          </span>
        </div>
      </div>
    </div>
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

  // APENAS ADMIN E DONO TEM ACESSO
  const isAdminOrOwner = ['admin', 'dono'].includes(currentUser.role?.toLowerCase());

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

  // Bloquear acesso se não for Admin ou Dono
  if (!isAdminOrOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-flex p-4 bg-red-500/20 rounded-full mb-4">
                <Shield className="h-12 w-12 text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase">
                Acesso Negado
              </h3>
              <div className="inline-block px-4 py-2 bg-red-500/20 rounded-xl border border-red-500/30 mb-4">
                <p className="text-sm font-bold text-red-300">
                  Seu cargo: <RoleBadge role={currentUser.role} />
                </p>
              </div>
            </div>
            <p className="text-red-200 mb-6 leading-relaxed">
              Apenas <span className="font-black text-white">ADMIN</span> e <span className="font-black text-white">DONO</span> podem acessar o painel de gestão de usuários.
            </p>
            <div className="p-4 bg-black/20 rounded-xl border border-red-500/20">
              <p className="text-xs text-red-300 font-medium">
                💡 Entre em contato com um administrador para solicitar permissões
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      
      // Solicitar senha do admin
      const userPassword = prompt('Digite a senha para o novo usuário (mínimo 6 caracteres):');
      
      if (!userPassword || userPassword.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      // Criar usuário no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: userPassword,
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
            is_online: false,
            first_login: false
          }
        ]);

        if (insertError) throw insertError;

        setSuccess(`✅ Usuário criado com sucesso!\n📧 Email: ${email}\n👤 Usuário: ${username}\n🔑 Senha: ${userPassword}\n\n⚠️ ANOTE ESTAS INFORMAÇÕES!`);
        setEmail('');
        setRole('membro');
        await loadUsers();
        
        // Não fechar o modal para copiar as informações
        setTimeout(() => {
          if (confirm('Você anotou as informações? Clique OK para fechar.')) {
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
      
      if (error) {
        // Se o erro for de foreign key constraint
        if (error.message.includes('foreign key constraint') || error.message.includes('referenced')) {
          setError(`⚠️ ERRO: Este usuário tem vendas registradas!\n\n📋 SOLUÇÃO:\n1. Vá no Supabase SQL Editor\n2. Execute o script: FIX_DELETE_USER_FINAL.sql\n3. Tente deletar novamente\n\nOu mantenha o usuário e apenas desative-o.`);
          console.error('Foreign key constraint error. Execute FIX_DELETE_USER_FINAL.sql');
        } else {
          throw error;
        }
        return;
      }
      
      setSuccess(`Usuário "${username}" removido com sucesso!`);
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
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
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic">
            Painel Administrativo
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Gestão de Equipe
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50 hover:scale-105 transition-all"
        >
          <UserPlus size={18} />
          <span>Criar Usuário</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-500 text-green-300 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium whitespace-pre-line">{success}</span>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Users className="text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="font-black text-white uppercase text-lg tracking-tight">
                Equipe Ativa
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {users.length} {users.length === 1 ? 'membro' : 'membros'} cadastrados
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
              <span className="text-xs font-black text-green-400">
                {users.filter(u => u.is_online).length} Online
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-lg">Nenhum usuário cadastrado</p>
              <p className="text-slate-500 text-sm mt-2">Clique em "Criar Usuário" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="group relative bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-2xl p-5 hover:shadow-2xl hover:border-indigo-500 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Indicador Online */}
                  {user.is_online && (
                    <div className="absolute top-3 right-3">
                      <div className="relative">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-slate-600">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {user.id === currentUser.id && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                          <Crown size={12} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-white text-lg truncate">
                          {user.username}
                        </p>
                        {user.id === currentUser.id && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-[9px] font-black text-yellow-400">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                        <Mail size={12} />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <RoleBadge role={user.role} />
                    </div>
                  </div>

                  {/* Ações */}
                  {user.id !== currentUser.id && canManageUser(user.role) && (
                    <div className="mt-4 pt-4 border-t border-slate-600 flex gap-2">
                      <button 
                        onClick={() => handlePromoteUser(user)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-sm"
                        title="Alterar cargo"
                      >
                        <ArrowUp size={16} />
                        Promover
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-sm"
                        title="Remover usuário"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {user.id === currentUser.id && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                        <Shield size={14} />
                        <span className="font-medium">Este é você</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <UserPlus className="text-indigo-400" />
                <span>Criar Novo Usuário</span>
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  E-mail do Membro
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@gmail.com"
                  className="w-full p-4 bg-slate-700 rounded-2xl border-2 border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold transition-all text-white placeholder-slate-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Cargo / Função
                </label>
                <select 
                  className="w-full p-4 bg-slate-700 rounded-2xl border-2 border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold transition-all text-white"
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
                  className="flex-1 px-6 py-4 bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-900/50 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <ArrowUp className="text-indigo-400" />
                <span>Alterar Cargo</span>
              </h3>
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                  setError(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            {/* Info do Usuário */}
            <div className="mb-6 p-4 bg-slate-700/50 rounded-2xl border border-slate-600">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-black text-white text-lg">{selectedUser.username}</p>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase font-bold">Cargo Atual:</span>
                <RoleBadge role={selectedUser.role} />
              </div>
            </div>

            {/* Seleção de Cargo */}
            <div className="space-y-3 mb-6">
              <label className="block text-xs font-black text-slate-400 uppercase mb-3">
                Selecione o Novo Cargo
              </label>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'membro', label: 'Membro', icon: '👤', desc: 'Vendedor básico', level: 1 },
                  { value: 'admin', label: 'Admin', icon: '🔴', desc: 'Configurações', level: 2, minLevel: 2 },
                  { value: 'sub-lider', label: 'Sub-Líder', icon: '⭐', desc: 'Supervisão', level: 3, minLevel: 3 },
                  { value: 'gerente', label: 'Gerente', icon: '💼', desc: 'Gestão de equipe', level: 4, minLevel: 4 },
                  { value: 'dono', label: 'Dono', icon: '👑', desc: 'Acesso total', level: 5, minLevel: 5 },
                ].filter(r => !r.minLevel || roleHierarchy[currentUser.role] >= r.minLevel).map((roleOption) => (
                  <button
                    key={roleOption.value}
                    type="button"
                    onClick={() => setNewRole(roleOption.value)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      newRole === roleOption.value
                        ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{roleOption.icon}</div>
                      <div className="flex-1">
                        <p className="font-black text-white text-sm">{roleOption.label}</p>
                        <p className="text-xs text-slate-400">{roleOption.desc}</p>
                      </div>
                      {newRole === roleOption.value && (
                        <CheckCircle className="text-indigo-400" size={20} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                  setError(null);
                }}
                className="flex-1 px-6 py-4 bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-600 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleChangeRole}
                disabled={loading || newRole === selectedUser.role}
                className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-900/50 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Alterando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}