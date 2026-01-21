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
  Database,
  Menu,
  X
} from 'lucide-react';
import { UserProfile, Workout, TrainingGoal } from './types';
import Dashboard from './pages/Dashboard';
import Treinos from './pages/Treinos';
import Metas from './pages/Metas';
import CalendarioProvas from './pages/CalendarioProvas';
import PlanoTreino from './pages/PlanoTreino';
import Profile from './pages/Profile';
import { 
  fetchWorkouts, 
  fetchLatestProfile, 
  saveProfile, 
  getSupabase, 
  fetchGoals, 
  upsertGoal, 
  deleteGoalDb 
} from './services/supabaseService';
import { classifyWorkout } from './services/workoutUtils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'treinos' | 'metas' | 'calendario' | 'plano' | 'dashboard'>('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
  const [goals, setGoals] = useState<TrainingGoal[]>([]);

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
      
      // Carregar Perfil, Treinos e Metas em paralelo para performance
      const [profileData, workoutsData, goalsData] = await Promise.all([
        fetchLatestProfile(),
        fetchWorkouts(),
        fetchGoals()
      ]);

      let currentProfile = profile;
      if (profileData) {
        setProfile(profileData);
        currentProfile = profileData;
      }

      if (goalsData && goalsData.length > 0) {
        setGoals(goalsData);
      } else {
        // Fallback para localStorage apenas se o DB estiver vazio
        const savedGoals = localStorage.getItem('elite_run_goals');
        if (savedGoals) setGoals(JSON.parse(savedGoals));
      }

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

  const handleAddGoal = async (newGoal: TrainingGoal) => {
    // Atualização Otimista da UI
    const updatedGoals = [newGoal, ...goals];
    setGoals(updatedGoals);
    localStorage.setItem('elite_run_goals', JSON.stringify(updatedGoals));
    
    // Sincronização com o Banco
    if (dbConnected) {
      const success = await upsertGoal(newGoal);
      if (success) {
        // Recarrega para obter o ID gerado pelo banco se necessário
        const freshGoals = await fetchGoals();
        setGoals(freshGoals);
      }
    }
  };

  const handleUpdateGoal = async (updatedGoal: TrainingGoal) => {
    const updatedGoals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    setGoals(updatedGoals);
    localStorage.setItem('elite_run_goals', JSON.stringify(updatedGoals));
    
    if (dbConnected) {
      await upsertGoal(updatedGoal);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id);
    setGoals(updatedGoals);
    localStorage.setItem('elite_run_goals', JSON.stringify(updatedGoals));
    
    if (dbConnected) {
      await deleteGoalDb(id);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setShowProfile(false);
    setIsMenuOpen(false);
  };

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
              <div className="hidden sm:block">
                <p className="text-amber-500 font-bold text-sm uppercase tracking-tighter">Modo Offline / Demonstração</p>
                <p className="text-slate-500 text-xs">As chaves do Supabase não foram detectadas.</p>
              </div>
            </div>
            <a href="https://vercel.com" target="_blank" className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-3 py-1 rounded-lg">Como conectar?</a>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard workouts={workouts} goals={goals} profile={profile} />}
        {activeTab === 'treinos' && <Treinos workouts={workouts} profile={profile} />}
        {activeTab === 'metas' && <Metas goals={goals} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} onDeleteGoal={handleDeleteGoal} />}
        {activeTab === 'calendario' && <CalendarioProvas />}
        {activeTab === 'plano' && <PlanoTreino profile={profile} workouts={workouts} goals={goals} />}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-emerald-500">
              <Zap size={32} fill="currentColor" />
              <h1 className="font-bold text-xl tracking-tight uppercase leading-none">Elite Run<br/><span className="text-[10px] opacity-50 tracking-[0.3em]">Coach AI</span></h1>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <nav className="space-y-1">
            <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><BarChart3 size={20} /> <span className="font-medium">Dashboard</span></button>
            <button onClick={() => handleTabChange('treinos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'treinos' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Activity size={20} /> <span className="font-medium">Treinos</span></button>
            <button onClick={() => handleTabChange('metas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'metas' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Target size={20} /> <span className="font-medium">Metas</span></button>
            <button onClick={() => handleTabChange('calendario')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'calendario' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Calendar size={20} /> <span className="font-medium">Calendário</span></button>
            <button onClick={() => handleTabChange('plano')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'plano' && !showProfile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Map size={20} /> <span className="font-medium">Plano IA</span></button>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={() => { loadData(true); setIsMenuOpen(false); }} 
            disabled={isRefreshing || !dbConnected}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all border border-slate-700 disabled:opacity-20"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="truncate">{isRefreshing ? 'Sincronizando...' : 'Sincronizar Cloud'}</span>
          </button>
        </div>
      </aside>

      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="sticky top-0 z-30 p-4 lg:p-6 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border-b border-slate-900 lg:bg-transparent lg:border-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl lg:text-2xl font-bold capitalize truncate">
              {showProfile ? 'Perfil' : activeTab}
            </h2>
          </div>
          
          <button 
            onClick={() => { setShowProfile(!showProfile); setIsMenuOpen(false); }} 
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden bg-slate-800 ${showProfile ? 'border-emerald-500 scale-110' : 'border-slate-700 hover:border-slate-500'}`}
          >
            <img src={profile.photoUrl || `https://picsum.photos/seed/${profile.name}/100/100`} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </header>

        <div className="px-4 lg:px-6 pb-12 flex-1">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;