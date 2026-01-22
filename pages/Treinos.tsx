
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
  ListOrdered,
  Clock
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

const parseLocalDate = (dateStr: string) => {
  if (!dateStr || dateStr === 'Invalid Date') return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
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
      setInsights("Erro ao conectar com o Coach.");
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

  // Helper para traduzir/estilizar o tipo de passo (Warmup, Cool down, Corrida, etc)
  const renderStepType = (step?: string) => {
    if (!step) return <span className="text-slate-700">--</span>;
    const s = step.toLowerCase();
    
    // Mapeamento de tipos comuns e traduções
    if (s.includes('aquecimento') || s.includes('warmup')) 
      return <span className="text-blue-400 uppercase font-black text-[8px] bg-blue-500/10 px-1.5 py-0.5 rounded">Aquece</span>;
    
    if (s.includes('corrida') || s.includes('run') || s.includes('active')) 
      return <span className="text-emerald-500 uppercase font-black text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Corrida</span>;
    
    if (s.includes('recuperação') || s.includes('recuperacao') || s.includes('recovery')) 
      return <span className="text-indigo-400 uppercase font-black text-[8px] bg-indigo-500/10 px-1.5 py-0.5 rounded">Recup</span>;
    
    if (s.includes('desaquecimento') || s.includes('cooldown') || s.includes('cool_down')) 
      return <span className="text-slate-400 uppercase font-black text-[8px] bg-slate-500/10 px-1.5 py-0.5 rounded">Desaquece</span>;
    
    if (s.includes('tiro') || s.includes('interval')) 
      return <span className="text-rose-500 uppercase font-black text-[8px] bg-rose-500/10 px-1.5 py-0.5 rounded">Tiro</span>;

    return <span className="text-slate-500 uppercase font-black text-[8px] border border-slate-800 px-1.5 py-0.5 rounded">{step}</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-[1600px] mx-auto pb-10">
      {/* Lista de Treinos */}
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
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-400 outline-none appearance-none pr-8 relative cursor-pointer">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-400 outline-none appearance-none pr-8 relative cursor-pointer">
              <option value="all">Anos</option>
              {availableYears.map(year => <option key={year} value={year.toString()}>{year}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 custom-scrollbar">
          {filteredWorkouts.length > 0 ? filteredWorkouts.map(workout => {
            const styles = getTypeStyles(workout.type);
            const Icon = styles.icon;
            return (
              <button
                key={workout.id}
                onClick={() => setSelectedWorkout(workout)}
                className={`w-full text-left glass p-4 rounded-2xl flex items-center justify-between group transition-all ${selectedWorkout?.id === workout.id ? 'ring-1 ring-emerald-500 bg-emerald-500/5' : 'hover:bg-slate-800/30'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${styles.bg} ${styles.color}`}><Icon size={18} /></div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-200 tracking-wide">{parseLocalDate(workout.date).toLocaleDateString('pt-BR')}</span>
                    <div className="mt-0.5"><span className={`text-[8px] font-black uppercase tracking-[0.1em] ${styles.color}`}>{workout.type}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-100">{workout.avgPace}</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <p className="text-[9px] text-slate-500 uppercase font-bold">{workout.distance.toFixed(2)} km</p>
                      <span className="text-slate-700 text-[8px]">•</span>
                      <p className="text-[9px] text-emerald-500/70 font-bold flex items-center gap-0.5"><Clock size={8} /> {workout.duration}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-700" />
                </div>
              </button>
            );
          }) : (
            <div className="p-8 text-center text-slate-600 glass rounded-3xl border-dashed border border-slate-800">
              <Activity className="mx-auto opacity-10 mb-3" size={24} />
              <p className="text-xs font-bold">Nenhum treino encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalhes do Treino */}
      <div className={`${selectedWorkout ? 'block' : 'hidden lg:block'}`}>
        {selectedWorkout ? (
          <div className="glass rounded-[2.5rem] overflow-hidden flex flex-col max-h-[88vh] shadow-2xl">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 border-b border-white/5">
              <button onClick={() => setSelectedWorkout(null)} className="lg:hidden flex items-center gap-2 text-slate-500 mb-4 text-[10px] font-bold uppercase"><ArrowLeft size={14} /> Voltar</button>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-widest">{parseLocalDate(selectedWorkout.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedWorkout.type}</h3>
                </div>
                <div className="bg-slate-950/50 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">{selectedWorkout.duration}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Distância</p>
                  <p className="text-lg font-black">{selectedWorkout.distance.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-50">km</span></p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Pace Médio</p>
                  <p className="text-lg font-black">{selectedWorkout.avgPace}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-slate-500 uppercase font-black mb-1">FC Média</p>
                  <p className="text-lg font-black text-rose-500">{selectedWorkout.avgHR || '--'}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Carga</p>
                  <p className="text-lg font-black text-emerald-400">{selectedWorkout.trainingLoad || '--'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8 bg-slate-900/30 overflow-y-auto custom-scrollbar flex-1">
              {/* Dinâmicas Médias */}
              {selectedWorkout.biomechanics && (
                <div className="space-y-4">
                  <h5 className="font-black text-[10px] text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]"><Layers size={14} className="text-emerald-500" /> Dinâmicas Médias</h5>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Cadência</p>
                      <p className="text-sm font-black">{selectedWorkout.biomechanics.cadence || '--'} ppm</p>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Oscilação</p>
                      <p className="text-sm font-black">{selectedWorkout.biomechanics.verticalOscillation || '--'} cm</p>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Contato</p>
                      <p className="text-sm font-black">{selectedWorkout.biomechanics.groundContactTime || '--'} ms</p>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Passada</p>
                      <p className="text-sm font-black">{selectedWorkout.biomechanics.strideLength || '--'} m</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabela de Voltas Completa */}
              {selectedWorkout.laps && selectedWorkout.laps.length > 0 && (
                <div className="space-y-4">
                  <h5 className="font-black text-[10px] text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]"><ListOrdered size={14} className="text-emerald-500" /> Detalhes de Todas as Voltas ({selectedWorkout.laps.length})</h5>
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/20">
                    <table className="w-full text-[10px] text-left min-w-[1000px]">
                      <thead className="bg-slate-900/80 text-slate-500 uppercase font-black">
                        <tr>
                          <th className="px-4 py-3 sticky left-0 bg-slate-900 z-10">#</th>
                          <th className="px-4 py-3 text-emerald-400">Tipo</th>
                          <th className="px-4 py-3">Dist</th>
                          <th className="px-4 py-3 text-emerald-400">Tempo</th>
                          <th className="px-4 py-3 text-emerald-400">Pace</th>
                          <th className="px-4 py-3">FC Méd</th>
                          <th className="px-4 py-3">Cadência</th>
                          <th className="px-4 py-3 text-emerald-500/80">Osc.V (cm)</th>
                          <th className="px-4 py-3 text-emerald-500/80">C.Solo (ms)</th>
                          <th className="px-4 py-3 text-emerald-500/80">Passada (m)</th>
                          <th className="px-4 py-3 text-emerald-500/80">Prop.V (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedWorkout.laps.map((lap, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-black text-slate-400 sticky left-0 bg-slate-950/40">{lap.lapNumber}</td>
                            <td className="px-4 py-3">{renderStepType(lap.stepType)}</td>
                            <td className="px-4 py-3 font-bold">{lap.distance.toFixed(2)}k</td>
                            <td className="px-4 py-3 font-mono font-bold text-emerald-400/80">{lap.duration}</td>
                            <td className="px-4 py-3 font-black text-emerald-400">{lap.avgPace}</td>
                            <td className="px-4 py-3 font-bold text-rose-500">{lap.avgHR || '--'}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono">{lap.cadence || '--'}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono">{lap.verticalOscillation || '--'}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono">{lap.groundContactTime || '--'}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono">{lap.strideLength || '--'}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono">{lap.verticalRatio ? `${lap.verticalRatio}%` : '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[8px] text-slate-600 italic">Nota: Foram carregadas {selectedWorkout.laps.length} voltas registradas no arquivo.</p>
                </div>
              )}

              {/* Análise da IA */}
              <div className="space-y-4">
                <h5 className="font-black text-[10px] text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]"><Sparkles size={14} className="text-emerald-500" /> Feedback do Coach</h5>
                {!insights ? (
                  <div className="p-6 bg-slate-950/40 rounded-[2rem] border border-white/5 text-center">
                    <MessageSquareText className="mx-auto text-slate-700 mb-4 opacity-20" size={32} />
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">Como você se sentiu hoje?</p>
                    <textarea 
                      value={userPerception} 
                      onChange={(e) => setUserPerception(e.target.value)}
                      placeholder="Ex: Senti pernas pesadas no início, mas o coração estabilizou bem..." 
                      className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none h-24 mb-4 focus:ring-1 focus:ring-emerald-500"
                    />
                    <button 
                      onClick={() => handleFetchInsights(selectedWorkout)}
                      disabled={isLoadingInsights}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                    >
                      {isLoadingInsights ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Analisar Performance'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-950/60 p-6 rounded-[2rem] border border-emerald-500/10 shadow-lg prose prose-invert prose-xs max-w-none text-slate-300">
                       <div className="flex items-center gap-2 mb-4 text-emerald-500 font-black uppercase text-[10px]">
                         <Activity size={12}/> Análise Concluída
                       </div>
                       <div className="whitespace-pre-wrap">{insights}</div>
                    </div>

                    <div className="space-y-4 border-t border-white/5 pt-6">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Dúvidas sobre o treino?</p>
                      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar px-2">
                         {chatMessages.map((msg, i) => (
                           <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                               {msg.text}
                             </div>
                           </div>
                         ))}
                      </div>
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input 
                          type="text" 
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Pergunte ao coach..."
                          className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button type="submit" disabled={isSending} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50">
                          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-800">
            <Activity size={48} className="text-slate-700 mb-6 opacity-20" />
            <h4 className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">Selecione um Treino</h4>
            <p className="text-slate-600 text-xs mt-2 max-w-xs">Escolha uma atividade na lista ao lado para ver a análise profunda do Coach AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Treinos;
