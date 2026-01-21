import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronRight, 
  Search, 
  Zap, 
  Activity, 
  Clock, 
  Sparkles,
  Loader2,
  Layers,
  RefreshCw,
  TrendingUp,
  Map,
  Timer,
  Heart,
  Send,
  Flag,
  ArrowLeft,
  CalendarDays,
  Filter,
  MessageSquareText
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

const Treinos: React.FC<TreinosProps> = ({ workouts: initialWorkouts, profile }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [userPerception, setUserPerception] = useState('');
  
  // Estados de Filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  // Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Anos disponíveis nos treinos para o seletor
  const availableYears = useMemo(() => {
    const years = initialWorkouts.map(w => new Date(w.date).getFullYear());
    return Array.from(new Set(years)).sort((a: number, b: number) => b - a);
  }, [initialWorkouts]);

  // Lógica de Filtragem Combinada
  const filteredWorkouts = useMemo(() => {
    return initialWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
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

  const selectClasses = "bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer appearance-none pr-8 relative";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start relative">
      <div className={`space-y-4 ${selectedWorkout ? 'hidden lg:block' : 'block'}`}>
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por tipo ou distância..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
              <select 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className={`w-full ${selectClasses}`}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-[100px]">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
              <select 
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className={`w-full ${selectClasses}`}
              >
                <option value="all">Anos</option>
                {availableYears.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="px-1 flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {filteredWorkouts.length} treinos
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {filteredWorkouts.length > 0 ? filteredWorkouts.map(workout => {
            const styles = getTypeStyles(workout.type);
            const Icon = styles.icon;
            return (
              <button
                key={workout.id}
                onClick={() => setSelectedWorkout(workout)}
                className={`w-full text-left glass p-4 lg:p-5 rounded-2xl flex items-center justify-between group transition-all ${selectedWorkout?.id === workout.id ? 'ring-2 ring-emerald-500 border-transparent' : 'hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={`p-2.5 lg:p-3 rounded-xl ${styles.bg} ${styles.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs lg:text-sm font-bold text-slate-100 uppercase tracking-widest">
                         {new Date(workout.date).toLocaleDateString('pt-BR')}
                       </span>
                    </div>
                    <div className="mt-0.5">
                       <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] ${styles.color}`}>
                         {workout.type}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="text-right">
                    <p className="text-sm lg:text-base font-black text-slate-100">{workout.avgPace} <span className="text-[10px] font-normal opacity-50">/km</span></p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{workout.distance.toFixed(2)} km</p>
                  </div>
                  <ChevronRight size={18} className={`text-slate-600 transition-all ${selectedWorkout?.id === workout.id ? 'text-emerald-500 rotate-90 lg:rotate-0' : 'group-hover:text-slate-300'}`} />
                </div>
              </button>
            );
          }) : (
            <div className="p-12 text-center text-slate-500 glass rounded-3xl border-dashed border-2 border-slate-800">
              <Activity className="mx-auto opacity-20 mb-4" size={30} />
              <p className="font-bold text-slate-400">Nenhum treino encontrado</p>
            </div>
          )}
        </div>
      </div>

      <div className={`sticky top-24 ${selectedWorkout ? 'block' : 'hidden lg:block'}`}>
        {selectedWorkout ? (
          <div className="glass rounded-3xl overflow-hidden flex flex-col max-h-[85vh] lg:max-h-[85vh] shadow-2xl">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 lg:p-8 border-b border-slate-800">
              <button 
                onClick={() => setSelectedWorkout(null)}
                className="lg:hidden flex items-center gap-2 text-slate-400 mb-6 text-xs font-bold uppercase tracking-widest"
              >
                <ArrowLeft size={16} /> Voltar à Lista
              </button>
              
              <div className="flex justify-between items-start mb-6 lg:mb-10">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px] lg:text-sm font-mono tracking-widest uppercase">
                    {new Date(selectedWorkout.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase">{selectedWorkout.type}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div className="p-3 lg:p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black mb-1">Distância</p>
                  <p className="text-lg lg:text-xl font-black text-white">{selectedWorkout.distance.toFixed(2)}<span className="text-[10px] ml-1 font-normal text-slate-500">km</span></p>
                </div>
                <div className="p-3 lg:p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black mb-1">Ritmo</p>
                  <p className="text-lg lg:text-xl font-black text-white">{selectedWorkout.avgPace}</p>
                </div>
                <div className="p-3 lg:p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black mb-1">FC Média</p>
                  <p className="text-lg lg:text-xl font-black text-emerald-500">{selectedWorkout.avgHR || '--'}</p>
                </div>
                <div className="p-3 lg:p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black mb-1">Tempo</p>
                  <p className="text-lg lg:text-xl font-black text-white truncate">{selectedWorkout.duration}</p>
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 space-y-8 bg-slate-900/20 overflow-y-auto custom-scrollbar">
              <div className="pt-2">
                {isLoadingInsights ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-slate-900/40 rounded-3xl border border-white/5">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">Cruzando Dados Técnicos + Percepção...</p>
                  </div>
                ) : (insights || selectedWorkout.aiAnalysis) ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-500/5 rounded-3xl p-5 lg:p-8 border border-emerald-500/20 shadow-inner">
                      <h5 className="text-emerald-500 font-black text-[10px] uppercase mb-4 flex items-center gap-2 tracking-[0.2em]">
                        <Sparkles size={16} fill="currentColor" /> Feedback do Coach AI
                      </h5>
                      <div className="text-slate-300 text-xs lg:text-sm leading-relaxed whitespace-pre-wrap font-medium prose prose-invert">
                        {insights || selectedWorkout.aiAnalysis}
                      </div>
                    </div>

                    <div className="space-y-4">
                       <h5 className="font-black text-[10px] text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]">
                        <MessageSquareText size={14} className="text-emerald-500" /> Tira Dúvidas Técnico
                      </h5>
                      <div className="glass bg-slate-950/40 rounded-2xl overflow-hidden flex flex-col border border-white/5">
                        <div className="p-4 max-h-[300px] overflow-y-auto space-y-4 custom-scrollbar text-xs">
                          {chatMessages.length === 0 && (
                            <p className="text-center text-slate-600 py-4 italic">Alguma dúvida sobre as zonas de FC ou biomecânica deste treino?</p>
                          )}
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl p-3 ${
                                msg.role === 'user' 
                                  ? 'bg-emerald-600 text-white shadow-lg' 
                                  : 'bg-slate-800 text-slate-200 border border-white/10'
                              }`}>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/60 border-t border-white/5 flex gap-2">
                          <input 
                            type="text" 
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Pergunte algo técnico..."
                            className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                          />
                          <button 
                            type="submit"
                            disabled={isSending || !userInput.trim()}
                            className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-400 disabled:opacity-20 transition-all shadow-lg shadow-emerald-500/10"
                          >
                            <Send size={18} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="text-emerald-500" size={18} />
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Como foi a estrutura e sua percepção de esforço?
                        </label>
                      </div>
                      <textarea
                        value={userPerception}
                        onChange={(e) => setUserPerception(e.target.value)}
                        placeholder="Ex: Tentei manter o pace de limiar mas senti as pernas pesadas no km 8. Estrutura foi 2km aquec + 6km ritmo + 2km desc."
                        className="w-full h-32 bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none placeholder:text-slate-700"
                      />
                      <p className="text-[10px] text-slate-600 leading-tight">
                        * Sua explicação ajuda o Coach a cruzar dados do Garmin (FC, Cadência) com seu estado físico real para uma análise muito mais leve e precisa.
                      </p>
                    </div>

                    <button 
                      onClick={() => handleFetchInsights(selectedWorkout)}
                      disabled={!userPerception.trim()}
                      className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                      <Sparkles size={18} fill="currentColor" />
                      Analisar com Coach AI
                    </button>
                  </div>
                )}
              </div>

              {selectedWorkout.biomechanics && (
                <div className="pt-8 border-t border-white/5">
                  <h5 className="font-black text-[10px] text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                    <Layers size={14} className="text-emerald-500" /> Dinâmicas de Corrida
                  </h5>
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Cadência</p>
                      <p className="text-base lg:text-lg font-black">{selectedWorkout.biomechanics.cadence || '--'} <span className="text-[8px] font-normal opacity-50 uppercase tracking-tighter">ppm</span></p>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Oscilação</p>
                      <p className="text-base lg:text-lg font-black">{selectedWorkout.biomechanics.verticalOscillation || '--'} <span className="text-[8px] font-normal opacity-50 uppercase tracking-tighter">cm</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl h-[500px] hidden lg:flex flex-col items-center justify-center text-center p-12 text-slate-500 border-dashed border-2 border-slate-800/50">
            <Activity size={48} className="opacity-10 mb-6" />
            <h4 className="text-lg font-black text-slate-700 uppercase tracking-[0.3em]">Treino não selecionado</h4>
            <p className="max-w-[200px] text-xs mt-2 opacity-40">Selecione uma atividade na lista ao lado para iniciar a análise técnica do Coach.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Treinos;