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
  Flag
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
      {/* Lista de Treinos */}
      <div className="space-y-4">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar nos treinos salvos..." 
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
                className={`w-full text-left glass p-5 rounded-2xl flex items-center justify-between group transition-all ${selectedWorkout?.id === workout.id ? 'ring-2 ring-emerald-500 border-transparent shadow-lg shadow-emerald-500/10' : 'hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${styles.bg} ${styles.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-100 uppercase tracking-widest">
                         {new Date(workout.date).toLocaleDateString('pt-BR')}
                       </span>
                    </div>
                    <div className="mt-0.5">
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${styles.color}`}>
                         {workout.type}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-base font-black text-slate-100">{workout.avgPace} <span className="text-[10px] font-normal opacity-50">/km</span></p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{workout.distance.toFixed(2)} km</p>
                  </div>
                  <ChevronRight className={`text-slate-600 transition-all ${selectedWorkout?.id === workout.id ? 'text-emerald-500 rotate-90' : 'group-hover:text-slate-300'}`} />
                </div>
              </button>
            );
          }) : (
            <div className="p-12 text-center text-slate-500 glass rounded-3xl border-dashed border-2 border-slate-800 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Activity className="opacity-50" size={30} />
              </div>
              <p className="mb-2 font-bold text-slate-300">Nenhum treino encontrado</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">Sincronize com a nuvem para visualizar seu histórico.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalhes do Treino Selecionado */}
      <div className="sticky top-24">
        {selectedWorkout ? (
          <div className="glass rounded-3xl overflow-hidden flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 border-b border-slate-800">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <p className="text-slate-400 text-sm font-mono tracking-widest uppercase">
                    {new Date(selectedWorkout.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase">{selectedWorkout.type}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getTypeStyles(selectedWorkout.type).bg} ${getTypeStyles(selectedWorkout.type).color}`}>
                     Analizado via Cloud
                  </span>
                  {selectedWorkout.filename && (
                    <span className="text-[10px] text-slate-500 font-mono">{selectedWorkout.filename}</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Distância</p>
                  <p className="text-xl font-black text-white">{selectedWorkout.distance.toFixed(2)}<span className="text-xs ml-1 font-normal text-slate-500">km</span></p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Ritmo Médio</p>
                  <p className="text-xl font-black text-white">{selectedWorkout.avgPace}<span className="text-[10px] ml-1 font-normal">/km</span></p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">FC Média</p>
                  <p className="text-xl font-black text-emerald-500">{selectedWorkout.avgHR || '--'}<span className="text-[10px] ml-1 font-normal">bpm</span></p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Tempo</p>
                  <p className="text-xl font-black text-white">{selectedWorkout.duration}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-10 bg-slate-900/20">
              {/* Biomecânica Garmin */}
              {selectedWorkout.biomechanics && (
                <div>
                  <h5 className="font-black text-xs text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                    <Layers size={14} className="text-emerald-500" /> Dinâmicas de Corrida
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><RefreshCw size={10} /> Cadência</p>
                      <p className="text-lg font-black">{selectedWorkout.biomechanics.cadence || '--'} <span className="text-[10px] font-normal text-slate-500">ppm</span></p>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Wind size={10} /> Oscilação</p>
                      <p className="text-lg font-black">{selectedWorkout.biomechanics.verticalOscillation || '--'} <span className="text-[10px] font-normal text-slate-500">cm</span></p>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><MoveHorizontal size={10} /> Passada</p>
                      <p className="text-lg font-black">{selectedWorkout.biomechanics.strideLength ? selectedWorkout.biomechanics.strideLength.toFixed(2) : '--'} <span className="text-[10px] font-normal text-slate-500">m</span></p>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Clock size={10} /> Contato</p>
                      <p className="text-lg font-black">{selectedWorkout.biomechanics.groundContactTime ? selectedWorkout.biomechanics.groundContactTime : '--'} <span className="text-[10px] font-normal text-slate-500">ms</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabela de Voltas (Laps) */}
              {selectedWorkout.laps && selectedWorkout.laps.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h5 className="font-black text-xs text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                    <Flag size={14} className="text-emerald-500" /> Parciais por Volta
                  </h5>
                  <div className="glass rounded-2xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/40 font-black tracking-widest border-b border-white/5">
                          <tr>
                            <th className="px-4 py-3 text-center w-12">#</th>
                            <th className="px-4 py-3">Tempo</th>
                            <th className="px-4 py-3 text-right">Distância</th>
                            <th className="px-4 py-3 text-right">Pace</th>
                            <th className="px-4 py-3 text-right">FC Média</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedWorkout.laps.map((lap) => (
                            <tr key={lap.lapNumber} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 text-center font-mono text-slate-500 font-bold">{lap.lapNumber}</td>
                              <td className="px-4 py-3 font-medium text-slate-300 font-mono">{lap.duration}</td>
                              <td className="px-4 py-3 text-right text-slate-400">{lap.distance.toFixed(3)} km</td>
                              <td className="px-4 py-3 text-right text-emerald-500 font-bold font-mono">{lap.avgPace}</td>
                              <td className="px-4 py-3 text-right text-rose-400 font-mono">{lap.avgHR ? Math.round(lap.avgHR) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback de IA e Chat */}
              <div className="pt-6 border-t border-white/10 space-y-8">
                {isLoadingInsights ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-4">
                    <Loader2 className="animate-spin text-emerald-500" size={36} />
                    <p className="text-sm font-bold tracking-widest uppercase animate-pulse">Consultando Coach Elite...</p>
                  </div>
                ) : (insights || selectedWorkout.aiAnalysis) ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-emerald-500/5 rounded-3xl p-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      <h5 className="text-emerald-500 font-black text-xs uppercase mb-4 flex items-center gap-2 tracking-widest">
                        <Sparkles size={16} fill="currentColor" /> Coach Feedback
                      </h5>
                      <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {insights || selectedWorkout.aiAnalysis}
                      </div>
                    </div>

                    {/* Chat Interativo */}
                    <div className="space-y-4">
                      <h5 className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-widest">
                        <MessageSquare size={14} className="text-emerald-500" /> Tire suas dúvidas sobre este treino
                      </h5>
                      
                      <div className="glass bg-slate-950/40 rounded-3xl overflow-hidden flex flex-col border border-white/5">
                        <div className="p-4 max-h-[300px] overflow-y-auto space-y-4 custom-scrollbar">
                          {chatMessages.length === 0 && (
                            <p className="text-center text-slate-600 text-[10px] py-4 uppercase font-bold tracking-tighter">
                              Pergunte ao coach sobre seu pace, cadência ou cansaço...
                            </p>
                          )}
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl p-3 text-sm font-medium ${
                                msg.role === 'user' 
                                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                   {msg.role === 'user' ? <User size={10} /> : <Zap size={10} className="text-emerald-500" />}
                                   <span className="text-[8px] uppercase font-black opacity-50 tracking-widest">
                                     {msg.role === 'user' ? 'Você' : 'Coach Elite'}
                                   </span>
                                </div>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                          {isSending && (
                            <div className="flex justify-start">
                              <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3 border border-white/5 flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin text-emerald-500" />
                                <span className="text-[8px] uppercase font-black tracking-widest">O Coach está escrevendo...</span>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/80 border-t border-white/5 flex gap-2">
                          <input 
                            type="text" 
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Dúvida sobre este treino..."
                            className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
                          />
                          <button 
                            type="submit"
                            disabled={isSending || !userInput.trim()}
                            className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-400 disabled:opacity-20 transition-all flex items-center justify-center min-w-[40px]"
                          >
                            <Send size={18} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleFetchInsights(selectedWorkout)}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 rounded-2xl font-black text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.01] hover:shadow-emerald-500/30 transition-all uppercase tracking-widest"
                  >
                    <Sparkles size={20} />
                    Analisar com IA
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-12 text-slate-500 border-dashed border-2 border-slate-800">
            <Activity size={60} className="opacity-10 mb-6" />
            <h4 className="text-2xl font-black text-slate-300 mb-3 uppercase tracking-tighter">Seu histórico</h4>
            <p className="max-w-xs leading-relaxed">Selecione um treino à esquerda para ver os detalhes da performance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Treinos;