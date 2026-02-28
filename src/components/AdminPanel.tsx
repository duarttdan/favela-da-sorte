import { useState, useEffect, useCallback } from 'react';
import { supabase, User as SupabaseUser } from '../lib/supabase';
import { Users, UserPlus, Trash2, Mail, AlertCircle, CheckCircle, X } from 'lucide-react';

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

export function AdminPanel({ currentUser }: { currentUser: SupabaseUser }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

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

      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (existingUser) {
        throw new Error('Este email já está cadastrado');
      }

      // Criar apenas o registro na tabela users
      // O usuário precisará se registrar com este email para criar a conta de autenticação
      const { error: insertError } = await supabase.from('users').insert([
        { 
          email: email.trim().toLowerCase(), 
          role: role.toLowerCase(), 
          username: username,
          is_online: false 
        }
      ]);

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          throw new Error('Este email já está cadastrado');
        }
        throw insertError;
      }

      setSuccess(`Perfil criado! O usuário deve se registrar com o email: ${email}`);
      setEmail('');
      setRole('member');
      setShowCreateModal(false);
      await loadUsers();
    } catch (error: any) {
      setError(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (id === currentUser.id) {
      setError('Você não pode excluir a si mesmo!');
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

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <RoleBadge role={user.role} />
                    {user.id !== currentUser.id && (
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                        title="Remover usuário"
                      >
                        <Trash2 size={18} />
                      </button>
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
                  <option value="member">Membro (Vendedor)</option>
                  <option value="setter">Setado (Sub-Líder)</option>
                  <option value="admin">Administrador (Dono)</option>
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
    </div>
  );
}