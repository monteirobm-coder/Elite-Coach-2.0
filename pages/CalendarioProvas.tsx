
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  ExternalLink, 
  Trophy, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  Map, 
  Sparkles, 
  Loader2, 
  Search,
  Globe
} from 'lucide-react';
import { Race } from '../types';
import { searchManausRaces } from '../services/geminiService';

interface CalendarioProvasProps {
  races: Race[];
  onAddRace: (race: Race) => void;
  onUpdateRace: (race: Race) => void;
  onDeleteRace: (id: string) => void;
}

const CalendarioProvas: React.FC<CalendarioProvasProps> = ({ races, onAddRace, onUpdateRace, onDeleteRace }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  
  // Estados para Busca IA
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Partial<Race>[]>([]);
  const [searchSources, setSearchSources] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Estados do formulário
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [distance, setDistance] = useState('10km');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'Inscrito' | 'Planejado' | 'Interessado'>('Planejado');

  const handleOpenEdit = (race: Race) => {
    setEditingRace(race);
    setName(race.name);
    setDate(race.date);
    setDistance(race.distance);
    setLocation(race.location);
    setStatus(race.status);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingRace(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDate('');
    setDistance('10km');
    setLocation('');
    setStatus('Planejado');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    const raceData: Race = {
      id: editingRace ? editingRace.id : `r-${Date.now()}`,
      name,
      date,
      distance,
      location,
      status
    };

    if (editingRace) {
      onUpdateRace(raceData);
    } else {
      onAddRace(raceData);
    }
    handleClose();
  };

  const handleDiscoverRaces = async () => {
    setIsSearching(true);
    setShowResults(false);
    try {
      const { races: found, sources } = await searchManausRaces();
      setSearchResults(found);
      setSearchSources(sources);
      setShowResults(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFoundRace = (race: Partial<Race>) => {
    const newRace: Race = {
      id: `r-${Date.now()}`,
      name: race.name || 'Nova Prova',
      date: race.date || '',
      distance: race.distance || '10km',
      location: race.location || 'Manaus, AM',
      status: 'Interessado'
    };
    onAddRace(newRace);
    // Remove da lista de resultados para dar feedback visual
    setSearchResults(prev => prev.filter(r => r.name !== race.name));
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Inscrito': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Planejado': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h3 className="text-xl font-bold flex items-center gap-2">
             <Trophy size={20} className="text-emerald-500" /> Planejamento de Provas
           </h3>
           <p className="text-slate-500 text-xs">Mantenha seu calendário de competições em Manaus atualizado.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleDiscoverRaces}
            disabled={isSearching}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-indigo-900/20"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isSearching ? 'Buscando...' : 'Descobrir em Manaus (IA)'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus size={16} /> Nova Prova
          </button>
        </div>
      </div>

      {/* Resultados da Busca IA */}
      {showResults && (
        <div className="animate-in slide-in-from-top-4 duration-500 space-y-4">
          <div className="flex justify-between items-center">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
               <Globe size={14} /> Resultados da Web (Próximos 4 Meses)
             </h4>
             <button onClick={() => setShowResults(false)} className="text-slate-600 hover:text-white transition-colors"><X size={14}/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.length > 0 ? searchResults.map((res, i) => (
              <div key={i} className="glass p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">{res.distance}</span>
                    <span className="text-[9px] font-bold text-slate-500">{res.date ? new Date(res.date).toLocaleDateString('pt-BR') : 'Data a definir'}</span>
                  </div>
                  <h5 className="font-bold text-xs text-white uppercase leading-tight mb-2 group-hover:text-indigo-400 transition-colors">{res.name}</h5>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin size={10} /> {res.location}</p>
                </div>
                <button 
                  onClick={() => handleAddFoundRace(res)}
                  className="mt-4 w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Adicionar ao Calendário
                </button>
              </div>
            )) : (
              <div className="col-span-full py-6 text-center glass border-indigo-500/10">
                <p className="text-slate-500 text-[10px] font-bold uppercase">Nenhuma prova futura encontrada no momento.</p>
              </div>
            )}
          </div>

          {searchSources.length > 0 && (
            <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Fontes da Pesquisa:</p>
              <div className="flex flex-wrap gap-2">
                {searchSources.map((chunk, idx) => (
                  <a 
                    key={idx} 
                    href={chunk.web?.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] text-indigo-400/60 hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink size={10} /> {chunk.web?.title || 'Fonte'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendário Atual */}
      <div className="grid grid-cols-1 gap-4">
        {races.length > 0 ? races.map(race => (
          <div key={race.id} className="glass p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center gap-4">
              <div className="text-center w-14 py-2 px-1 bg-slate-900/80 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-[10px] text-slate-500 uppercase font-black">{new Date(race.date).toLocaleString('pt-BR', { month: 'short' })}</p>
                <p className="text-xl font-black leading-none text-emerald-500">{new Date(race.date).getUTCDate()}</p>
              </div>
              <div>
                <h5 className="font-black text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{race.name}</h5>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[10px] text-slate-500 mt-1.5 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><CalendarIcon size={12} className="text-emerald-500" /> {race.distance}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-emerald-500" /> {race.location}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(race.status)}`}>
                {race.status}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleOpenEdit(race)}
                  className="p-2 text-slate-500 hover:text-emerald-500 transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => onDeleteRace(race.id)}
                  className="p-2 text-slate-500 hover:text-rose-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center glass rounded-[3rem] border-dashed border-2 border-slate-800">
             <CalendarIcon size={40} className="mx-auto text-slate-700 mb-4 opacity-20" />
             <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Nenhuma prova agendada</p>
             <p className="text-slate-600 text-xs mt-2">Clique em "Descobrir em Manaus" para encontrar desafios.</p>
          </div>
        )}
      </div>

      {/* Modal de Nova/Editar Prova */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 lg:p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50">
               <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tighter">
                 {editingRace ? 'Editar Prova' : 'Adicionar Prova'}
               </h3>
               <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white transition-all bg-slate-800 rounded-full">
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nome da Competição</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maratona de Manaus"
                  className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Data da Prova</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Distância</label>
                  <select 
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    <option value="5km">5 km</option>
                    <option value="10km">10 km</option>
                    <option value="15km">15 km</option>
                    <option value="21.1km">21.1 km (Meia)</option>
                    <option value="42.2km">42.2 km (Maratona)</option>
                    <option value="Ultra">Ultra-Maratona</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Localização</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Ponta Negra, Manaus"
                    className="w-full bg-slate-950/80 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Status da Inscrição</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Inscrito', 'Planejado', 'Interessado'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        status === s 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40' 
                        : 'bg-slate-950/50 border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
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
                  className="flex-2 grow-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
                >
                  {editingRace ? 'Salvar Alterações' : 'Salvar Prova'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioProvas;
