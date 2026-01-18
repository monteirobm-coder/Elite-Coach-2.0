import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  Search, 
  Zap, 
  Activity, 
  Clock, 
  Sparkles,
  Loader2,
  Wind,
  Layers,
  MoveHorizontal,
  RefreshCw,
  TrendingUp,
  Map,
  Timer,
  Heart,
  Send,
  MessageSquare,
  User,
  Flag,
  ArrowLeft
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

const Treinos: React.FC<TreinosProps> = ({ workouts: initialWorkouts, profile }) => {
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWorkouts(initialWorkouts);
  }, [initialWorkouts]);

  useEffect(() => {
    if (selectedWorkout) {
      setInsights(selectedWorkout.aiAnalysis || null);
      setChatMessages([]);
      setUserInput('');
      // No mobile, rola para o topo ao selecionar
      if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedWorkout]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFetchInsights = async (workout: Workout) => {
    setIsLoadingInsights(true);
    try {
      const result = await getCoachAnalysis(workout, profile, workouts.filter(w => w.id !== workout.id));
      setInsights(result);
    } catch (err) {
      console.error("Erro ao buscar insights:", err);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start relative">
      {/* Lista de Treinos - Oculta no mobile se um treino estiver selecionado */}
      <div className={`space-y-4 ${selectedWorkout ? 'hidden lg:block' : 'block'}`}>
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar treinos..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-3">
          {workouts.length > 0 ? workouts.map(workout => {
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
              <Activity className="mx-auto opacity-50 mb-4" size={30} />
              <p className="font-bold text-slate-300">Nenhum treino</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalhes do Treino Selecionado */}
      <div className={`sticky top-24 ${selectedWorkout ? 'block' : 'hidden lg:block'}`}>
        {selectedWorkout ? (
          <div className="glass rounded-3xl overflow-hidden flex flex-col max-h-[85vh] lg:max-h-[85vh] shadow-2xl">
            {/* Header do Detalhe com botão de voltar no Mobile */}
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
                    {new Date(selectedWorkout.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                  <h3 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase">{selectedWorkout.type}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${getTypeStyles(selectedWorkout.type).bg} ${getTypeStyles(selectedWorkout.type).color}`}>
                     Garmin Cloud
                  </span>
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
              {/* Dinâmicas */}
              {selectedWorkout.biomechanics && (
                <div>
                  <h5 className="font-black text-[10px] text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                    <Layers size={14} className="text-emerald-500" /> Dinâmicas
                  </h5>
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="bg-slate-900/60 p-3 lg:p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Cadência</p>
                      <p className="text-base lg:text-lg font-black">{selectedWorkout.biomechanics.cadence || '--'} <span className="text-[8px] font-normal opacity-50">ppm</span></p>
                    </div>
                    <div className="bg-slate-900/60 p-3 lg:p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Oscilação</p>
                      <p className="text-base lg:text-lg font-black">{selectedWorkout.biomechanics.verticalOscillation || '--'} <span className="text-[8px] font-normal opacity-50">cm</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Laps Mobile Friendly */}
              {selectedWorkout.laps && selectedWorkout.laps.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h5 className="font-black text-[10px] text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                    <Flag size={14} className="text-emerald-500" /> Parciais
                  </h5>
                  <div className="glass rounded-2xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[8px] text-slate-500 uppercase bg-slate-950/40 font-black tracking-widest border-b border-white/5">
                          <tr>
                            <th className="px-3 py-2 text-center w-8">#</th>
                            <th className="px-3 py-2">Tempo</th>
                            <th className="px-3 py-2 text-right">Km</th>
                            <th className="px-3 py-2 text-right">Pace</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedWorkout.laps.map((lap) => (
                            <tr key={lap.lapNumber} className="hover:bg-slate-800/30">
                              <td className="px-3 py-2 text-center font-mono text-slate-500">{lap.lapNumber}</td>
                              <td className="px-3 py-2 font-mono text-slate-300">{lap.duration}</td>
                              <td className="px-3 py-2 text-right text-slate-400">{lap.distance.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right text-emerald-500 font-bold font-mono">{lap.avgPace}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* IA e Chat */}
              <div className="pt-6 border-t border-white/10 space-y-6">
                {isLoadingInsights ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-3">
                    <Loader2 className="animate-spin text-emerald-500" size={28} />
                    <p className="text-[10px] font-bold tracking-widest uppercase">Consultando Coach...</p>
                  </div>
                ) : (insights || selectedWorkout.aiAnalysis) ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-500/5 rounded-2xl p-4 lg:p-6 border border-emerald-500/20">
                      <h5 className="text-emerald-500 font-black text-[10px] uppercase mb-3 flex items-center gap-2 tracking-widest">
                        <Sparkles size={14} fill="currentColor" /> Coach Feedback
                      </h5>
                      <div className="text-slate-300 text-xs lg:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {insights || selectedWorkout.aiAnalysis}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="glass bg-slate-950/40 rounded-2xl overflow-hidden flex flex-col border border-white/5">
                        <div className="p-3 max-h-[250px] overflow-y-auto space-y-3 custom-scrollbar text-xs">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[90%] rounded-xl p-2.5 ${
                                msg.role === 'user' 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-slate-800 text-slate-200 border border-white/5'
                              }`}>
                                <p>{msg.text}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-2 bg-slate-900 border-t border-white/5 flex gap-2">
                          <input 
                            type="text" 
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Dúvida?"
                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button 
                            type="submit"
                            disabled={isSending || !userInput.trim()}
                            className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-400 disabled:opacity-20"
                          >
                            <Send size={16} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleFetchInsights(selectedWorkout)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 py-3 rounded-xl font-black text-white text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                  >
                    <Sparkles size={16} />
                    Analisar com IA
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl h-[400px] hidden lg:flex flex-col items-center justify-center text-center p-8 text-slate-500 border-dashed border-2 border-slate-800">
            <Activity size={40} className="opacity-10 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Selecione um treino</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Treinos;