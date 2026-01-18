
import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Activity, 
  Award, 
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { Workout, TrainingGoal, UserProfile } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  workouts: Workout[];
  goals: TrainingGoal[];
  profile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ workouts, goals, profile }) => {
  const chartData = [...workouts].reverse().map(w => ({
    name: w.date.split('-')[2] + '/' + w.date.split('-')[1],
    load: w.trainingLoad || 0,
    km: w.distance || 0
  }));

  const totalKm = workouts.reduce((acc, curr) => acc + (curr.distance || 0), 0);
  const lastWorkout = workouts[0];
  const avgPace = lastWorkout ? lastWorkout.avgPace : "--:--";

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Activity size={20} />
            </div>
            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
              Ativo <ArrowUpRight size={12} />
            </span>
          </div>
          <p className="text-slate-400 text-sm">Volume Total</p>
          <h3 className="text-2xl font-bold">{totalKm.toFixed(1)} <span className="text-sm font-normal text-slate-500">km</span></h3>
        </div>

        <div className="glass p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Zap size={20} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">VO2 Max</p>
          <h3 className="text-2xl font-bold">{profile.vo2Max}</h3>
        </div>

        <div className="glass p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Pace (Último)</p>
          <h3 className="text-2xl font-bold">{avgPace} <span className="text-sm font-normal text-slate-500">/km</span></h3>
        </div>

        <div className="glass p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Award size={20} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Carga Atual</p>
          <h3 className="text-2xl font-bold">{lastWorkout?.trainingLoad || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts - Fix width with min-w-0 on parent and min-h for container */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-semibold text-lg">Histórico de Carga</h4>
            <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-lg">
              Garmin 965 Dynamics
            </div>
          </div>
          
          <div className="h-[320px] w-full min-h-[320px]">
            {workouts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="load" stroke="#10b981" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                 <p className="text-slate-500 text-sm">Nenhum dado de carga disponível</p>
              </div>
            )}
          </div>
        </div>

        {/* Goals Progress */}
        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-semibold text-lg">Metas Ativas</h4>
            <button className="text-emerald-500 text-sm font-medium hover:underline">Ver todas</button>
          </div>
          <div className="space-y-6 flex-1">
            {goals.map(goal => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-200 font-medium">{goal.title}</span>
                  <span className="text-slate-400">{goal.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000" 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">Alvo: {goal.targetValue} em {new Date(goal.targetDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 p-4 rounded-xl border border-emerald-500/20">
              <h5 className="text-sm font-bold text-emerald-500 mb-1 flex items-center gap-2">
                <TrendingUp size={16} /> Insights do Coach
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {workouts.length > 0 
                  ? `Baseado no seu último treino de ${workouts[0].distance}km, sua eficiência biomecânica está acima da média para seu VO2 Max.`
                  : "Importe seu primeiro treino para receber insights personalizados da IA."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
