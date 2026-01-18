
import React from 'react';
import { Target, Plus, Trophy, Calendar } from 'lucide-react';
import { TrainingGoal } from '../types';

interface MetasProps {
  goals: TrainingGoal[];
}

const Metas: React.FC<MetasProps> = ({ goals }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-400">Gerencie seus objetivos de curto e longo prazo.</p>
        <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">
          <Plus size={18} /> Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => (
          <div key={goal.id} className="glass p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy size={120} />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-white">{goal.title}</h4>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <Calendar size={14} />
                    <span>Prazo: {new Date(goal.targetDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl">
                  <Target size={24} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progresso</span>
                  <span className="text-emerald-500 font-bold">{goal.progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000" 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Resultado Alvo</p>
                  <p className="text-lg font-bold text-emerald-500">{goal.targetValue}</p>
                </div>
                <button className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Detalhes</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Metas;
