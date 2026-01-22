
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronRight, 
  Search, 
  Zap, 
  Activity, 
  Sparkles,
  Loader2,
  Layers,
  TrendingUp,
  Map,
  Timer,
  Heart,
  Send,
  ArrowLeft,
  CalendarDays,
  Filter,
  MessageSquareText,
  ListOrdered
} from 'lucide-react';
import { Workout, UserProfile } from '../types';
import { getCoachAnalysis, askCoachAboutWorkout } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface TreinosProps {
  workouts: Workout[];
  profile: UserProfile;
}

const MONTHS = [
  { value: 'all', label: 'Todos os Meses' },
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

/**
 * Função simplificada que trata a data recebida YYYY-MM-DD como literal local.
 */
const parseLocalDate = (dateStr: string) => {
  if (!dateStr || dateStr === 'Invalid Date') return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  // New Date(Y, M, D) cria no fuso local do navegador preservando o dia literal
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const Treinos: React.FC<TreinosProps> = ({ workouts: initialWorkouts, profile }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [userPerception, setUserPerception] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const availableYears = useMemo(() => {
    const years = initialWorkouts.map(w => parseLocalDate(w.date).getFullYear());
    return Array.from(new Set(years)).sort((a: number, b: number) => b - a);
  }, [initialWorkouts]);

  const filteredWorkouts = useMemo(() => {
    return initialWorkouts.filter(workout => {
      const workoutDate = parseLocalDate(workout.date);
      const matchesSearch = workout.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            workout.distance.toString().includes(searchQuery);
      const matchesMonth = filterMonth === 'all' || workoutDate.getMonth().toString() === filterMonth;
      const matchesYear = filterYear === 'all' || workoutDate.getFullYear().toString() === filterYear;
      
      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [initialWorkouts, searchQuery, filterMonth, filterYear]);

  useEffect(() => {
    if (selectedWorkout) {
      setInsights(selectedWorkout.aiAnalysis || null);
      setChatMessages([]);
      setUserInput('');
      setUserPerception('');
      if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedWorkout]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFetchInsights = async (workout: Workout) => {
    if (!userPerception.trim()) {
      alert("Por favor, descreva sua percepção de esforço antes de analisar.");
      return;
    }
    
    setIsLoadingInsights(true);
    try {
      const recentHistory = initialWorkouts
        .filter(w => w.id !== workout.id)
        .slice(0, 5);

      const result = await getCoachAnalysis(workout, profile, recentHistory, userPerception);
      setInsights(result);
    } catch (err) {
      console.error("Erro ao buscar insights:", err);
      setInsights("Erro ao conectar com o Coach. Tente novamente em instantes.");
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || !selectedWorkout || isSending) return;

    const userText = userInput.trim();
    const newMessages: Message[] = [...chatMessages, { role: 'user', text: userText }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsSending(true);

    try {
      const response = await askCoachAboutWorkout(userText, selectedWorkout, profile, chatMessages);
      setChatMessages([...newMessages, { role: 'model', text: response }]);
    } catch (err) {
      console.error("Erro no chat:", err);
    } finally {
      setIsSending(false);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Longão': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Map };
      case 'Intervalado': return { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Zap };
      case 'Tempo Run': return { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Timer };
      case 'Regenerativo': return { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Heart };
      case 'Fartlek': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: TrendingUp };
      default: return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Activity };
    }
  };

  const selectClasses = "bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-400 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer appearance-none pr-8 relative";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start relative max-w-[1600px] mx-auto">
      <div className={`space-y-4 ${selectedWorkout ? 'hidden lg:block' : 'block'}`}>
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input 
              type="text" 
              placeholder="Buscar treino..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className={selectClasses}
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select 
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className={selectClasses}
            >
              <option value="all">Anos</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-1 custom-scrollbar">
          {filteredWorkouts.length > 0 ? filteredWorkouts.map(workout => {
            const styles = getTypeStyles(workout.type);
            const Icon = styles.icon;
            const workoutLocalDate = parseLocalDate(workout.date);
            return (
              <button
                key={workout.id}
                onClick={() => setSelectedWorkout(workout)}
                className={`w-full text-left glass p-3 lg:p-4 rounded-2xl flex items-center justify-between group transition-all ${selectedWorkout?.id === workout.id ? 'ring-1 ring-emerald-500 bg-emerald-500/5 border-transparent' : 'hover:bg-slate-800/30'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${styles.bg} ${styles.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-bold text-slate-200 tracking-wide">
                         {workoutLocalDate.toLocaleDateString('pt-BR')}
                       </span>
                    </div>
                    <div className="mt-0.5">
                       <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${styles.color}`}>
                         {workout.type}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs lg:text-sm font-black text-slate-100">{workout.avgPace}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">{workout.distance.toFixed(2)} km</p>
                  </div>
                  <ChevronRight size={14} className={`text-slate-700 transition-all ${selectedWorkout?.id === workout.id ? 'text-emerald-500 rotate-90 lg:rotate-0' : 'group-hover:text-slate-500'}`} />
                </div>
              </button>
            );
          }) : (
            <div className="p-8 text-center text-slate-600 glass rounded-3xl border-dashed border border-slate-800">
              <Activity className="mx-auto opacity-10 mb-3" size={24} />
              <p className="text-xs font-bold">Nenhum treino</p>
            </div>
          )}
        </div>
      </div>

      <div className={`sticky top-20 lg:top-24 ${selectedWorkout ? 'block' : 'hidden lg:block'}`}>
        {selectedWorkout ? (
          <div className="glass rounded-[2.5rem] overflow-hidden flex flex-col max-h-[88vh] shadow-2xl border-white/5">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 lg:p-7 border-b border-white/5">
              <button 
                onClick={() => setSelectedWorkout(null)}
                className="lg:hidden flex items-center gap-2 text-slate-500 mb-4 text-[10px] font-bold uppercase tracking-widest"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
              
              <div className="flex justify-between items-start mb-5 lg:mb-8">
                <div className="space-y-0.5">
                  <p className="text-emerald-500/60 text-[9px] lg:text-[11px] font-black tracking-widest uppercase">
                    {parseLocalDate(selectedWorkout.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="text-xl lg:text-3xl font-black text-white tracking-tighter uppercase leading-none">{selectedWorkout.type}</h3>
                </div>
                <div className="bg-slate-950/50 px-3 py-1.5 rounded-full border border-white/5">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{selectedWorkout.duration}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <p className="text-[7px] lg:text-[9px] text-slate-500 uppercase font-black mb-0.5">Distância</p>
                  <p className="text-base lg:text-xl font-black text-white">{selectedWorkout.distance.toFixed(2)}<span className="text-[10px] ml-0.5 font-normal text-slate-500">km</span></p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <p className="text-[7px] lg:text-[9px] text-slate-500 uppercase font-black mb-0.5">Pace Médio</p>
                  <p className="text-base lg:text-xl font-black text-white">{selectedWorkout.avgPace}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <p className="text-[7px] lg:text-[9px] text-slate-500 uppercase font-black mb-0.5">FC Média</p>
                  <p className="text-base lg:text-xl font-black text-rose-500">{selectedWorkout.avgHR || '--'}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <p className="text-[7px] lg:text-[9px] text-slate-500 uppercase font-black mb-0.5">Carga</p>
                  <p className="text-base lg:text-xl font-black text-emerald-400">{selectedWorkout.trainingLoad || '--'}</p>
                </div>
              </div>
            </div>

            <div className="p-5 lg:p-7 space-y-6 lg:space-y-8 bg-slate-900/30 overflow-y-auto custom-scrollbar flex-1">
              {selectedWorkout.biomechanics && (
                <div className="space-y-3">
                  <h5 className="font-black text-[9px] text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]">
                    <Layers size={12} className="text-emerald-500" /> Dinâmicas Médias
                  </h5>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="bg-slate-950/40 p-2.5 lg:p-3 rounded-xl border border-white/5">
                      <p className="text-[7px] text-slate-500 uppercase font-black mb-0.5">Cadência</p>
                      <p className="text-xs lg:text-sm font-black">{selectedWorkout.biomechanics.cadence || '--'} <span className="text-[7px] font-normal opacity-50 uppercase tracking-tighter">ppm</span></p>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 lg:p-3 rounded-xl border border-white/5">
                      <p className="text-[7px] text-slate-500 uppercase font-black mb-0.5">Oscilação</p>
                      <p className="text-xs lg:text-sm font-black">{selectedWorkout.biomechanics.verticalOscillation || '--'} <span className="text-[7px] font-normal opacity-50 uppercase tracking-tighter">cm</span></p>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 lg:p-3 rounded-xl border border-white/5">
                      <p className="text-[7px] text-slate-500 uppercase font-black mb-0.5">Contato</p>
                      <p className="text-xs lg:text-sm font-black">{selectedWorkout.biomechanics.groundContactTime || '--'} <span className="text-[7px] font-normal opacity-50 uppercase tracking-tighter">ms</span></p>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 lg:p-3 rounded-xl border border-white/5">
                      <p className="text-[7px] text-slate-500 uppercase font-black mb-0.5">Passada</p>
                      <p className="text-xs lg:text-sm font-black">{selectedWorkout.biomechanics.strideLength || '--'} <span className="text-[7px] font-normal opacity-50 uppercase tracking-tighter">m</span></p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h5 className="font-black text-[9px] text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]">
                  <ListOrdered size={12} className="text-emerald-500" /> Laps / Detalhamento
                </h5>
                <div className="overflow-x-auto glass rounded-2xl border border-white/5 bg-slate-950/30">
                  <table className="w-full text-[9px] lg:text-[11px] text-left border-collapse min-w-[700px]">
                    <thead className="bg-slate-900/60 text-slate-500 uppercase font-black tracking-widest border-b border-white/5">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">Dist.</th>
                        <th className="px-3 py-2.5">Tempo</th>
                        <th className="px-3 py-2.5">Pace</th>
                        <th className="px-3 py-2.5 text-rose-500/80">FC</th>
                        <th className="px-3 py-2.5 text-emerald-500/80">Cad.</th>
                        <th className="px-3 py-2.5">Passada</th>
                        <th className="px-3 py-2.5">Osc. V</th>
                        <th className="px-3 py-2.5 text-indigo-400/80">Prop. V</th>
                        <th className="px-3 py-2.5 text-amber-500/80">GCT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedWorkout.laps && selectedWorkout.laps.length > 0 ? selectedWorkout.laps.map((lap, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors font-mono">
                          <td className="px-3 py-2 text-slate-600">{lap.lapNumber || idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-slate-300">{lap.distance.toFixed(2)}k</td>
                          <td className="px-3 py-2 text-slate-400">{lap.duration}</td>
                          <td className="px-3 py-2 font-black text-emerald-500/80">{lap.avgPace}</td>
                          <td className="px-3 py-2 text-rose-400 font-bold">{lap.avgHR || '--'}</td>
                          <td className="px-3 py-2 text-emerald-400/60">{lap.cadence || '--'}</td>
                          <td className="px-3 py-2 text-slate-500">{lap.strideLength ? `${lap.strideLength.toFixed(2)}m` : '--'}</td>
                          <td className="px-3 py-2 text-slate-500">{lap.verticalOscillation ? `${lap.verticalOscillation.toFixed(1)}c` : '--'}</td>
                          <td className="px-3 py-2 text-indigo-400/70">{lap.verticalRatio ? `${lap.verticalRatio.toFixed(1)}%` : '--'}</td>
                          <td className="px-3 py-2 text-amber-400/70">{lap.groundContactTime ? `${lap.groundContactTime}ms` : '--'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={10} className="px-4 py-6 text-center text-slate-600 italic">Sem voltas registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2">
                {isLoadingInsights ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-3 bg-slate-900/40 rounded-3xl border border-white/5">
                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                    <p className="text-[8px] font-black tracking-[0.3em] uppercase animate-pulse">Consultando Coach AI...</p>
                  </div>
                ) : (insights || selectedWorkout.aiAnalysis) ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-500/[0.03] rounded-[2rem] p-5 lg:p-7 border border-emerald-500/10 shadow-inner">
                      <h5 className="text-emerald-500 font-black text-[9px] uppercase mb-4 flex items-center gap-2 tracking-[0.2em]">
                        <Sparkles size={14} fill="currentColor" /> Feedback de Performance
                      </h5>
                      <div className="text-slate-300 text-xs lg:text-sm leading-relaxed whitespace-pre-wrap font-medium prose prose-invert max-w-none">
                        {insights || selectedWorkout.aiAnalysis}
                      </div>
                    </div>

                    <div className="space-y-3">
                       <h5 className="font-black text-[9px] text-slate-600 uppercase flex items-center gap-2 tracking-[0.2em]">
                        <MessageSquareText size={12} className="text-emerald-500" /> Consultoria Técnica
                      </h5>
                      <div className="glass bg-slate-950/40 rounded-2xl overflow-hidden flex flex-col border border-white/5">
                        <div className="p-4 max-h-[200px] overflow-y-auto space-y-3 custom-scrollbar text-xs">
                          {chatMessages.length === 0 && (
                            <p className="text-center text-slate-700 py-2 text-[10px] italic">Dúvidas sobre o pace ou biomecânica desta sessão?</p>
                          )}
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[90%] rounded-xl p-2.5 ${
                                msg.role === 'user' 
                                  ? 'bg-emerald-600/90 text-white shadow-lg' 
                                  : 'bg-slate-800/80 text-slate-300 border border-white/5'
                              }`}>
                                <p className="leading-relaxed text-[11px]">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-2 bg-slate-900/80 border-t border-white/5 flex gap-2">
                          <input 
                            type="text" 
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Pergunta técnica..."
                            className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                          />
                          <button 
                            type="submit"
                            disabled={isSending || !userInput.trim()}
                            className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-400 disabled:opacity-20 transition-all"
                          >
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="bg-slate-950/30 p-5 rounded-3xl border border-white/5 space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="text-emerald-500" size={16} />
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                          Como você se sentiu hoje?
                        </label>
                      </div>
                      <textarea
                        value={userPerception}
                        onChange={(e) => setUserPerception(e.target.value)}
                        placeholder="Ex: Perna pesada no km final. Tentei focar na cadência."
                        className="w-full h-24 bg-slate-950/80 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none placeholder:text-slate-800"
                      />
                    </div>

                    <button 
                      onClick={() => handleFetchInsights(selectedWorkout)}
                      disabled={!userPerception.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800/50 disabled:text-slate-700 py-3.5 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 transition-all active:scale-[0.98]"
                    >
                      <Sparkles size={16} fill="currentColor" />
                      Analisar Sessão
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-[3rem] h-[500px] hidden lg:flex flex-col items-center justify-center text-center p-12 text-slate-700 border-dashed border-2 border-slate-900/50">
            <Activity size={40} className="opacity-10 mb-4" />
            <h4 className="text-sm font-black uppercase tracking-[0.3em]">Nenhum Treino</h4>
            <p className="max-w-[200px] text-[10px] mt-2 opacity-40 font-bold uppercase tracking-widest">Selecione uma atividade para iniciar o Coach.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Treinos;
