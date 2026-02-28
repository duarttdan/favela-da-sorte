import { useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';
import { Target, TrendingUp, Calendar, Award, Plus, Edit2, Trash2 } from 'lucide-react';

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: 'active' | 'completed' | 'expired';
  created_at: string;
}

export function GoalsPanel({ currentUser }: { currentUser: User }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    loadGoals();
  }, [currentUser.id]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Atualizar progresso das metas
      const goalsWithProgress = await Promise.all(
        data.map(async (goal) => {
          const { data: sales } = await supabase
            .from('sales')
            .select('seller_profit')
            .eq('seller_id', currentUser.id)
            .gte('created_at', goal.created_at);

          const currentAmount = sales?.reduce((acc, s) => acc + s.seller_profit, 0) || 0;

          return { ...goal, current_amount: currentAmount };
        })
      );

      setGoals(goalsWithProgress);
    }
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('goals').insert({
      user_id: currentUser.id,
      title,
      target_amount: parseFloat(targetAmount),
      current_amount: 0,
      deadline,
      status: 'active',
    });

    if (!error) {
      setShowModal(false);
      setTitle('');
      setTargetAmount('');
      setDeadline('');
      loadGoals();
    }
  };

  const deleteGoal = async (id: string) => {
    if (confirm('Excluir esta meta?')) {
      await supabase.from('goals').delete().eq('id', id);
      loadGoals();
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter uppercase italic">
            Metas e Objetivos
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
            Acompanhe seu progresso
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = getProgress(goal);
          const daysRemaining = getDaysRemaining(goal.deadline);
          const isExpired = daysRemaining < 0;
          const isCompleted = progress >= 100;

          return (
            <div
              key={goal.id}
              className={`bg-white rounded-3xl p-6 border-2 transition-all hover:shadow-lg ${
                isCompleted
                  ? 'border-green-200 bg-green-50/30'
                  : isExpired
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className={`h-6 w-6 ${isCompleted ? 'text-green-600' : 'text-indigo-600'}`} />
                  <h3 className="font-black text-gray-800">{goal.title}</h3>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-gray-600">Progresso</span>
                    <span className="font-black text-indigo-600">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Atual</p>
                    <p className="text-lg font-black text-gray-800">
                      {formatarMoeda(goal.current_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold">Meta</p>
                    <p className="text-lg font-black text-indigo-600">
                      {formatarMoeda(goal.target_amount)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className={`font-bold ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                      {isExpired
                        ? 'Prazo expirado'
                        : daysRemaining === 0
                        ? 'Último dia!'
                        : `${daysRemaining} dias restantes`}
                    </span>
                  </div>
                </div>

                {isCompleted && (
                  <div className="flex items-center gap-2 p-3 bg-green-100 rounded-xl">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-black text-green-700">Meta Atingida! 🎉</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhuma meta criada ainda</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
            >
              Criar Primeira Meta
            </button>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black text-gray-800 mb-6">Nova Meta</h3>

            <form onSubmit={createGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                  Título da Meta
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  placeholder="Ex: Vender R$ 10.000 este mês"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                  Valor Alvo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  placeholder="10000.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                  Prazo
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
