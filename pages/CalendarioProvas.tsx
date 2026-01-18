
import React from 'react';
import { Calendar as CalendarIcon, MapPin, ExternalLink, Trophy } from 'lucide-react';

const races = [
  { id: '1', name: 'Maratona Internacional de SP', date: '2025-04-15', distance: '42.2km', location: 'São Paulo, SP', status: 'Inscrito' },
  { id: '2', name: 'Corrida do Meio Ambiente 10k', date: '2024-08-20', distance: '10km', location: 'Rio de Janeiro, RJ', status: 'Planejado' },
  { id: '3', name: 'Golden Run 21k', date: '2024-10-12', distance: '21.1km', location: 'Curitiba, PR', status: 'Interessado' },
];

const CalendarioProvas: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Trophy size={20} className="text-emerald-500" /> Minhas Próximas Provas</h4>
        <div className="space-y-4">
          {races.map(race => (
            <div key={race.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="flex items-center gap-4">
                <div className="text-center w-12 py-1 px-2 bg-slate-800 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase">{new Date(race.date).toLocaleString('pt-BR', { month: 'short' })}</p>
                  <p className="text-lg font-bold leading-none">{new Date(race.date).getDate()}</p>
                </div>
                <div>
                  <h5 className="font-bold text-white group-hover:text-emerald-500 transition-colors">{race.name}</h5>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><CalendarIcon size={12} /> {race.distance}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {race.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  race.status === 'Inscrito' ? 'bg-green-500/10 text-green-500' :
                  race.status === 'Planejado' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-slate-700/50 text-slate-400'
                }`}>
                  {race.status}
                </span>
                <button className="text-slate-600 hover:text-white"><ExternalLink size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-3xl text-center">
        <p className="text-emerald-500 font-medium text-sm mb-4 italic">"Faltam 128 dias para o seu objetivo principal: Maratona de SP"</p>
        <button className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-xl hover:bg-emerald-400 transition-all text-sm">
          Ajustar Ciclo de Treinamento
        </button>
      </div>
    </div>
  );
};

export default CalendarioProvas;
