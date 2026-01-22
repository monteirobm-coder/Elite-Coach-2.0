
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
  Menu,
  X
} from 'lucide-react';
import { UserProfile, Workout, TrainingGoal, Race } from './types';
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
  deleteGoalDb,
  fetchRaces,
  upsertRace,
  deleteRaceDb
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
    hrZones: { z1Low: 65, z1High: 80, z2High: 89, z3High: 95, z4High: 100 },
    prs: { k5: '5:03', k10: '6:40', k21: '--:--', k42: '--:--' },
    experience: 'Avançado'
  });

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [races, setRaces] = useState<Race[]>([]);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    const supabase = getSupabase();
    if (!supabase) {
      setDbConnected(false);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setDbConnected(true);
      const [profileData, workoutsData, goalsData, racesData] = await Promise.all([
        fetchLatestProfile(),
        fetchWorkouts(),
        fetchGoals(),
        fetchRaces()
      ]);

      if (profileData) setProfile(profileData);
      if (goalsData) setGoals(goalsData);
      if (racesData) setRaces(racesData);

      const classifiedWorkouts = workoutsData.map(w => ({
        ...w,
        type: classifyWorkout(w, profileData || profile)
      }));
      setWorkouts(classifiedWorkouts);
    } catch (err) {
      console.error("Load Data Error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (dbConnected) await saveProfile(updatedProfile);
  };

  const handleDataCleared = () => {
    setWorkouts([]);
    setShowProfile(false);
    setActiveTab('dashboard');
  };

  const handleAddGoal = async (newGoal: TrainingGoal) => {
    setGoals([newGoal, ...goals]);
    if (dbConnected) {
      await upsertGoal(newGoal);
      const fresh = await fetchGoals();
      setGoals(fresh);
    }
  };
  const handleUpdateGoal = async (updatedGoal: TrainingGoal) => {
    setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    if (dbConnected) {
      await upsertGoal(updatedGoal);
      const fresh = await fetchGoals();
      setGoals(fresh);
    }
  };
  const handleDeleteGoal = async (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    if (dbConnected) await deleteGoalDb(id);
  };

  const handleAddRace = async (newRace: Race) => {
    setRaces([...races, newRace]);
    if (dbConnected) {
      await upsertRace(newRace);
      const fresh = await fetchRaces();
      setRaces(fresh);
    }
  };
  const handleUpdateRace = async (updatedRace: Race) => {
    setRaces(races.map(r => r.id === updatedRace.id ? updatedRace : r));
    if (dbConnected) {
      await upsertRace(updatedRace);
      const fresh = await fetchRaces();
      setRaces(fresh);
    }
  };
  const handleDeleteRace = async (id: string) => {
    setRaces(races.filter(r => r.id !== id));
    if (dbConnected) await deleteRaceDb(id);
  };

  const renderContent = () => {
    if (showProfile) return <Profile profile={profile} onUpdate={handleUpdateProfile} onClose={() => setShowProfile(false)} onDataCleared={handleDataCleared} />;
    if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-slate-500"><Loader2 size={40} className="animate-spin text-emerald-500" /><p className="animate-pulse">Sincronizando dados...</p></div>;

    return (
      <div className="space-y-6">
        {activeTab === 'dashboard' && <Dashboard workouts={workouts} goals={goals} profile={profile} />}
        {activeTab === 'treinos' && <Treinos workouts={workouts} profile={profile} />}
        {activeTab === 'metas' && <Metas goals={goals} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} onDeleteGoal={handleDeleteGoal} />}
        {activeTab === 'calendario' && <CalendarioProvas races={races} onAddRace={handleAddRace} onUpdateRace={handleUpdateRace} onDeleteRace={handleDeleteRace} />}
        {activeTab === 'plano' && <PlanoTreino profile={profile} workouts={workouts} goals={goals} />}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 text-emerald-500">
            <Zap size={32} fill="currentColor" />
            <h1 className="font-bold text-xl uppercase leading-none">Elite Run<br/><span className="text-[10px] opacity-50 tracking-[0.3em]">Coach AI</span></h1>
            <button onClick={() => setIsMenuOpen(false)} className="lg:hidden p-2 text-slate-400"><X size={24} /></button>
          </div>
          <nav className="space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}><BarChart3 size={20} /> Dashboard</button>
            <button onClick={() => { setActiveTab('treinos'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'treinos' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}><Activity size={20} /> Treinos</button>
            <button onClick={() => { setActiveTab('metas'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'metas' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}><Target size={20} /> Metas</button>
            <button onClick={() => { setActiveTab('calendario'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'calendario' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}><Calendar size={20} /> Calendário</button>
            <button onClick={() => { setActiveTab('plano'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'plano' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}><Map size={20} /> Plano IA</button>
          </nav>
        </div>
        <div className="mt-auto p-6">
          <button onClick={() => loadData(true)} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 rounded-xl font-semibold border border-slate-700">
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="p-4 lg:p-6 flex justify-between items-center bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 bg-slate-900 border border-slate-800 rounded-xl"><Menu size={24} /></button>
          <h2 className="text-xl lg:text-2xl font-bold capitalize">{showProfile ? 'Perfil' : activeTab}</h2>
          <button onClick={() => setShowProfile(!showProfile)} className={`w-12 h-12 rounded-full border-2 overflow-hidden ${showProfile ? 'border-emerald-500' : 'border-slate-700'}`}>
            <img src={profile.photoUrl || `https://picsum.photos/seed/${profile.name}/100/100`} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </header>
        <div className="px-4 lg:px-6 pb-12 flex-1">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
