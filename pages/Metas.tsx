import React, { useState, useEffect } from 'react';
import { Target, Plus, Trophy, Calendar, X, Trash2, Info, Timer, Edit3 } from 'lucide-react';
import { TrainingGoal } from '../types';

interface MetasProps {
  goals: TrainingGoal[];
  onAddGoal: (goal: TrainingGoal) => void;
  onUpdateGoal: (goal: TrainingGoal) => void;
  onDeleteGoal: (id: string) => void;
}

const Metas: React.FC<MetasProps> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TrainingGoal | null>(null);
  
  // Estados para o formulário
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [distance, setDistance] = useState('10'); // km
  const [customDistance, setCustomDistance] = useState('');
  const [paceMin, setPaceMin] = useState('5');
  const [paceSec, setPaceSec] = useState('00');
  const [calculatedTime, setCalculatedTime] = useState('00:50:00');

  // Lógica de cálculo automático do Tempo Total baseado no Pace e Distância
  useEffect(() => {
    const d = distance === 'custom' ? parseFloat(customDistance) : parseFloat(distance);
    const pm = parseInt(paceMin) || 0;
    const ps = parseInt(paceSec) || 0;
    
    if (!isNaN(d) && d > 0) {
      const totalSecondsPerKm = (pm * 60) + ps;
      const totalSeconds = totalSecondsPerKm * d;
      
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = Math.round(totalSeconds % 60);
      
      setCalculatedTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    } else {
      setCalculatedTime('00:00:00');
    }
  }, [distance, customDistance, paceMin, paceSec]);

  const handleOpenEdit = (goal: TrainingGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetDate(goal.targetDate);
    
    // Tenta recuperar distância e pace se salvos, senão usa defaults
    const distVal = goal.targetDistance?.toString() || '10';
    if (['5', '10', '21.1', '42.195'].includes(distVal)) {
      setDistance(distVal);
    } else {
      setDistance('custom');
      setCustomDistance(distVal);
    }

    if (goal.targetPace) {
      const [m, s] = goal.targetPace.split(':');
      setPaceMin(m || '5');
      setPaceSec(s || '00');
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;

    const d = distance === 'custom' ? parseFloat(customDistance) : parseFloat(distance);
    const goalData: TrainingGoal = {
      id: editingGoal ? editingGoal.id : `g-${Date.now()}`,
      title,
      targetDate,
      targetValue: calculatedTime,
      targetDistance: d,
      targetPace: `${paceMin.padStart(1, '0')}:${paceSec.padStart(2, '0')}`,
      progress: editingGoal ? editingGoal.progress : 0
    };

    if (editingGoal) {
      onUpdateGoal(goalData);
    } else {
      onAddGoal(goalData);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTargetDate('');
    setDistance('10');
    setCustomDistance('');
    setPaceMin('5');
    setPaceSec('00');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-sm">Gerencie seus objetivos de curto e longo prazo.</p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          <Plus size={18} /> Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.length > 0 ? goals.map(goal => (
          <div key={goal.id} className="glass p-6 rounded-3xl relative overflow-hidden group border border-white/5 hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Trophy size={100} />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">{goal.title}</h4>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
                    <Calendar size={12} className="text-emerald-500" />
                    <span>Prazo: {new Date(goal.targetDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl">
                    <Target size={20} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 text-slate-600 hover:text-emerald-500 transition-colors"
                      title="Editar Meta"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors"
                      title="Excluir Meta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">Progresso Atual</span>
                  <span className="text-emerald-500">{goal.progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-end pt-2 border-t border-white/5">
                <div>
                  <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Tempo Alvo</p>
                  <p className="text-2xl font-black text-white">{goal.targetValue}</p>
                  {goal.targetPace && (
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Ritmo: {goal.targetPace} min/km</p>
                  )}
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-lg">Detalhes</button>
              </div>
            </div>
          </div>
        )) : (
          <div className="md:col-span-2 py-20 text-center glass rounded-[3rem] border-dashed border-2 border-slate-800">
             <Target size={40} className="mx-auto text-slate-700 mb-4 opacity-20" />
             <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Nenhuma meta ativa</p>
             <p className="text-slate-600 text-xs mt-2">Defina seu próximo desafio para começar.</p>
          </div>
        )}
      </div>

      {/* Modal de Nova/Editar Meta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 lg:p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50">
               <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tighter">
                 {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
               </h3>
               <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white transition-all bg-slate-800 rounded-full">
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Título da Meta</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Sub 50min nos 10km"
                  className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Data Limite</label>
                  <input 
                    type="date" 
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Distância</label>
                  <select 
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                  >
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="21.1">21.1 km (Meia)</option>
                    <option value="42.195">42.2 km (Maratona)</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
              </div>

              {distance === 'custom' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Distância Personalizada (km)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={customDistance}
                    onChange={(e) => setCustomDistance(e.target.value)}
                    placeholder="Ex: 15"
                    className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              )}

              <div className="bg-emerald-500/[0.03] p-6 rounded-3xl border border-emerald-500/10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <Timer size={16} className="text-emerald-500" />
                   <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Calculadora de Performance</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">Pace Alvo (min/km)</label>
                    <div className="flex items-center gap-2">
                       <input 
                        type="number" 
                        value={paceMin}
                        onChange={(e) => setPaceMin(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-center text-lg font-black text-white outline-none"
                      />
                      <span className="text-xl font-black text-slate-700">:</span>
                      <input 
                        type="number" 
                        max="59"
                        value={paceSec}
                        onChange={(e) => setPaceSec(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-center text-lg font-black text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">Tempo Final Estimado</label>
                    <div className="w-full bg-slate-900/80 border border-white/5 rounded-xl py-2 px-3 text-center flex items-center justify-center">
                      <span className="text-2xl font-black text-emerald-500 font-mono">{calculatedTime}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[9px] text-slate-600 italic leading-tight">
                  <Info size={10} className="inline mr-1" /> O tempo final é calculado multiplicando seu pace pela distância total da prova.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-2 grow-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {editingGoal ? 'Salvar Alterações' : 'Salvar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Metas;