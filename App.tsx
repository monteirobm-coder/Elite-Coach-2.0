import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Target, 
  Calendar, 
  Map, 
  BarChart3, 
  Zap,
  Loader2,
  RefreshCw,
  Database
} from 'lucide-react';
import { UserProfile, Workout, TrainingGoal } from './types';
import Dashboard from './pages/Dashboard';
import Treinos from './pages/Treinos';
import Metas from './pages/Metas';
import CalendarioProvas from './pages/CalendarioProvas';
import PlanoTreino from './pages/PlanoTreino';
import Profile from './pages/Profile';
import { fetchWorkouts, fetchLatestProfile, saveProfile, getSupabase } from './services/supabaseService';
import { classifyWorkout } from './services/workoutUtils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'treinos' | 'metas' | 'calendario' | 'plano' | 'dashboard'>('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Bruno Monteiro',
    birthDate: '1982-05-21',
    age: 42,
    weight: 79,
    height: 177,
    bodyFat: 9.3,
    restingHR: 48,
    maxHR: 188,
    vo2Max: 49,
    lactateThresholdPace: '5:03',
    lactateThresholdHR: 173,
    hrZones: {
      z1Low: 65,
      z1High: 80,
      z2High: 89,
      z3High: 95,
      z4High: 100
    },
    prs: {
      k5: '5:03',
      k10: '6:40',
      k21: '--:--',
      k42: '--:--'
    },
    experience: 'Avançado'
  });

  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Supabase não configurado. Usando modo de demonstração.");
      setDbConnected(false);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setDbConnected(true);
      const profileData = await fetchLatestProfile();
      let currentProfile = profile;
      if (profileData) {
        setProfile(profileData);
        currentProfile = profileData;
      }

      const workoutsData = await fetchWorkouts();
      const classifiedWorkouts = workoutsData.map(w => ({
        ...w,
        type: classifyWorkout(w, currentProfile)
      }));
      
      setWorkouts(classifiedWorkouts);
    } catch (err: any) {
      console.error("Erro ao carregar dados do Supabase:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (!dbConnected) return;
    
    const success = await saveProfile(updatedProfile);
    if (!success) {
      console.error("Erro ao salvar perfil");
    } else {
      const reclassified = workouts.map(w => ({
        ...w,
        type: classifyWorkout(w, updatedProfile)
      }));
      setWorkouts(reclassified);
    }
  };

  const [goals] = useState<TrainingGoal[]>([
    { id: 'g1', title: 'Sub 40min nos 10km', targetDate: '2024-12-01', targetValue: '39:59', progress: 65 },
    { id: 'g2', title: 'Maratona de SP', targetDate: '2025-04-15', targetValue: '03:15:00', progress: 20 }
  ]);

  const renderContent = () => {
    if (showProfile) return <Profile profile={profile} onUpdate={handleUpdateProfile} onClose={() => setShowProfile(false)} />;

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 gap-4">
          <Loader2 size={40} className="animate-spin text-emerald-500" />
          <p className="animate-pulse font-medium tracking-wide">Iniciando Elite Run Coach...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {!dbConnected && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="text-amber-500" size={20} />
              <div>
                <p className="text-amber-500 font-bold text-sm uppercase tracking-tighter">Modo Offline / Demonstração</p>
                <p className="text-slate-500 text-xs">As chaves do Supabase não foram detectadas neste ambiente.</p>
              </div>
            </div>
            <a href="https://vercel.com" target="_blank" className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-3 py-1 rounded-lg">Como conectar?</a>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard workouts={workouts} goals={goals} profile={profile} />}
        {activeTab === 'treinos' && <Treinos workouts={workouts} profile={profile} />}
        {activeTab === 'metas' && <Metas goals={goals} />}
        {activeTab === 'calendario' && <CalendarioProvas />}
        {activeTab === 'plano' && <PlanoTreino profile={profile} workouts={workouts} goals={goals} />}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className="w-64 glass border-r border-slate-800 flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 text-emerald-500 mb-8">
            <Zap size={32} fill="currentColor" />
            <h1 className="font-bold text-xl tracking-tight uppercase leading-none">Elite Run<br/><span className="text-[10px] opacity-50 tracking-[0.3em]">Coach AI</span></h1>
          </div>
          
          <nav className="space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setShowProfile(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><BarChart3 size={20} /> <span className="font-medium">Dashboard</span></button>
            <button onClick={() => { setActiveTab('treinos'); setShowProfile(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'treinos' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Activity size={20} /> <span className="font-medium">Treinos</span></button>
            <button onClick={() => { setActiveTab('metas'); setShowProfile(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'metas' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Target size={20} /> <span className="font-medium">Metas</span></button>
            <button onClick={() => { setActiveTab('calendario'); setShowProfile(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'calendario' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Calendar size={20} /> <span className="font-medium">Calendário</span></button>
            <button onClick={() => { setActiveTab('plano'); setShowProfile(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'plano' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Map size={20} /> <span className="font-medium">Plano IA</span></button>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={() => loadData(true)} 
            disabled={isRefreshing || !dbConnected}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all border border-slate-700 disabled:opacity-20"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Sincronizando...' : 'Sincronizar Cloud'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-10 p-6 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto">
             <h2 className="text-2xl font-bold capitalize">{showProfile ? 'Perfil' : activeTab}</h2>
          </div>
          <button onClick={() => setShowProfile(!showProfile)} className={`pointer-events-auto w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden bg-slate-800 ${showProfile ? 'border-emerald-500 scale-110' : 'border-slate-700 hover:border-slate-500'}`}>
            <img src={profile.photoUrl || `https://picsum.photos/seed/${profile.name}/100/100`} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </header>
        <div className="px-6 pb-12">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;