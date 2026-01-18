import React, { useState } from 'react';
import { UserProfile, Workout, TrainingGoal } from '../types';
import { generateTrainingPlan } from '../services/geminiService';
import { Loader2, Sparkles, Calendar, ArrowRight } from 'lucide-react';

interface PlanoTreinoProps {
  profile: UserProfile;
  workouts: Workout[];
  goals: TrainingGoal[];
}

const PlanoTreino: React.FC<PlanoTreinoProps> = ({ profile, workouts, goals }) => {
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateTrainingPlan(profile, goals, workouts);
      // Garante que o resultado seja uma string, usando um fallback se for null/undefined
      setPlan(result ?? "Não foi possível gerar o plano. Tente novamente.");
    } catch (err) {
      setPlan("Erro ao conectar com o servidor de IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!plan && !loading && (
        <div className="glass p-12 rounded-3xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
            <Sparkles size={40} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-2xl font-bold">Gere seu Plano com IA</h3>
            <p className="text-slate-500">O Coach AI analisará seu histórico do Garmin, VO2 Max e suas metas para criar um ciclo de treinamento personalizado.</p>
          </div>
          <button 
            onClick={handleGenerate}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
          >
            Gerar Plano Agora
          </button>
        </div>
      )}

      {loading && (
        <div className="glass p-24 rounded-3xl flex flex-col items-center justify-center space-y-4">
          <Loader2 size={48} className="animate-spin text-emerald-500" />
          <p className="text-slate-400 font-medium animate-pulse">Cruzando dados de biomecânica e metas...</p>
        </div>
      )}

      {plan && (
        <div className="glass p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Calendar className="text-emerald-500" /> Ciclo de Treinamento Sugerido
            </h3>
            <button 
              onClick={handleGenerate}
              className="text-xs font-bold text-slate-500 hover:text-emerald-500 flex items-center gap-1 transition-all"
            >
              Recalcular com IA <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="prose prose-invert max-w-none prose-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {plan}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanoTreino;