
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Workout, Lap, UserProfile, TrainingGoal, Race } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || "https://lmuphzeagwusflvwadge.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_fAlU4gn7vGt-PpDr-c88KA_Vp23vAiE";

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL === 'undefined') return null;

  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabaseInstance;
  } catch (error) {
    console.error("Erro ao inicializar Supabase:", error);
    return null;
  }
};

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const toManausDate = (isoString: string): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'America/Manaus', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(date);
  } catch (e) {
    return isoString.split('T')[0];
  }
};

export const fetchLatestProfile = async (): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return null;
    return {
      name: data.name || 'Atleta',
      birthDate: data.birth_date ? data.birth_date.split('T')[0] : '1982-05-21',
      age: 42,
      weight: parseFloat(data.weight) || 0,
      height: parseFloat(data.height) || 0,
      bodyFat: parseFloat(data.body_fat) || 0,
      restingHR: data.resting_hr || 0,
      maxHR: data.max_hr || 0,
      vo2Max: parseFloat(data.vo2_max) || 0,
      lactateThresholdPace: data.lactate_threshold_pace || '0:00',
      lactateThresholdHR: data.lactate_threshold_hr || 0,
      hrZones: data.hr_zones || { z1Low: 65, z1High: 80, z2High: 89, z3High: 95, z4High: 100 },
      prs: data.prs || { k5: '--:--', k10: '--:--', k21: '--:--', k42: '--:--' },
      experience: data.experience || 'Iniciante',
      photoUrl: data.photo_url
    };
  } catch (error) { return null; }
};

export const saveProfile = async (profile: UserProfile): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('profiles').insert([{
      name: profile.name,
      birth_date: profile.birthDate,
      weight: profile.weight,
      height: profile.height,
      body_fat: profile.bodyFat,
      resting_hr: profile.restingHR,
      max_hr: profile.maxHR,
      vo2_max: profile.vo2Max,
      lactate_threshold_pace: profile.lactateThresholdPace,
      lactate_threshold_hr: profile.lactateThresholdHR,
      hr_zones: profile.hrZones,
      prs: profile.prs,
      experience: profile.experience,
      photo_url: profile.photoUrl
    }]);
    return !error;
  } catch (error) { return false; }
};

export const fetchGoals = async (): Promise<TrainingGoal[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('training_goals').select('*').order('target_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      targetDate: row.target_date ? row.target_date.split('T')[0] : '',
      targetValue: row.target_value,
      targetDistance: parseFloat(row.target_distance),
      targetPace: row.target_pace,
      progress: row.progress || 0
    }));
  } catch (error) { return []; }
};

export const upsertGoal = async (goal: TrainingGoal): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const payload: any = {
      title: goal.title,
      target_date: goal.targetDate,
      target_value: goal.targetValue,
      target_distance: goal.targetDistance,
      target_pace: goal.targetPace,
      progress: goal.progress
    };
    if (isUUID(goal.id)) payload.id = goal.id;
    const { error } = await supabase.from('training_goals').upsert([payload], { onConflict: 'id' });
    return !error;
  } catch (error) { return false; }
};

export const deleteGoalDb = async (id: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !isUUID(id)) return false;
  try {
    const { error } = await supabase.from('training_goals').delete().eq('id', id);
    return !error;
  } catch (error) { return false; }
};

export const fetchRaces = async (): Promise<Race[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('races').select('*').order('date', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      date: row.date ? row.date.split('T')[0] : '',
      distance: row.distance,
      location: row.location,
      status: row.status
    }));
  } catch (error) { return []; }
};

export const upsertRace = async (race: Race): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const payload: any = {
      name: race.name,
      date: race.date,
      distance: race.distance,
      location: race.location,
      status: race.status
    };
    if (isUUID(race.id)) payload.id = race.id;
    const { error } = await supabase.from('races').upsert([payload], { onConflict: 'id' });
    return !error;
  } catch (error) { return false; }
};

export const deleteRaceDb = async (id: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !isUUID(id)) return true;
  try {
    const { error } = await supabase.from('races').delete().eq('id', id);
    return !error;
  } catch (error) { return false; }
};

export const fetchWorkouts = async (): Promise<Workout[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data: runsData, error } = await supabase.from('runs').select('*').order('date', { ascending: false });
    if (error) {
      console.error("Erro ao buscar treinos:", error);
      return [];
    }
    return (runsData || []).map((row: any) => ({
      id: row.id,
      date: row.date ? toManausDate(row.date) : '',
      title: row.filename ? row.filename.replace('.md', '').replace(/_/g, ' ') : 'Treino',
      type: 'Rodagem',
      distance: parseFloat(row.distance_km) || 0,
      duration: row.duration || '00:00:00',
      avgPace: '0:00',
      avgHR: row.avg_heart_rate || 0,
      trainingLoad: row.training_load || 0,
      maxHR: row.max_heart_rate,
      aiAnalysis: row.ai_analysis
    }));
  } catch (error) { return []; }
};

/**
 * Apaga todos os treinos de forma definitiva.
 * Usa um filtro dummy 'neq 000...' que o PostgREST aceita como 'deletar todos' 
 * se as permissões de RLS permitirem a deleção.
 */
export const deleteAllWorkouts = async (): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // 1. Apaga registros dependentes (biomecânica)
    await supabase.from('run_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 2. Apaga voltas (laps)
    await supabase.from('run_laps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 3. Apaga a tabela principal (runs)
    const { error } = await supabase.from('runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error("Erro Supabase ao deletar Runs:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro crítico ao deletar treinos:", error);
    return false;
  }
};
