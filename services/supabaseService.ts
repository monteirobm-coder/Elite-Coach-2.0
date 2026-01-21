
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Workout, Lap, UserProfile, TrainingGoal } from '../types';

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

export const fetchLatestProfile = async (): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return null;
    return {
      name: data.name || 'Atleta',
      birthDate: data.birth_date || '1990-01-01',
      age: calculateAge(data.birth_date || '1990-01-01'),
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

/**
 * TRAINING GOALS CRUD
 */

export const fetchGoals = async (): Promise<TrainingGoal[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('training_goals').select('*').order('target_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      targetDate: row.target_date,
      targetValue: row.target_value,
      targetDistance: parseFloat(row.target_distance),
      targetPace: row.target_pace,
      progress: row.progress || 0
    }));
  } catch (error) {
    console.error("fetchGoals Error:", error);
    return [];
  }
};

export const upsertGoal = async (goal: TrainingGoal): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    // Regex para validar se o ID é um UUID real do banco
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(goal.id);
    
    const payload: any = {
      title: goal.title,
      target_date: goal.targetDate,
      target_value: goal.targetValue,
      target_distance: goal.targetDistance,
      target_pace: goal.targetPace,
      progress: goal.progress
    };

    // Se for UUID, atualizamos. Se for ID temporário (ex: g-123), removemos para o banco gerar um novo.
    if (isUUID) {
      payload.id = goal.id;
    }

    const { error } = await supabase.from('training_goals').upsert([payload], { onConflict: 'id' });
    if (error) {
      console.error("Supabase Upsert Error Detail:", error.message, error.details, error.hint);
      return false;
    }
    return true;
  } catch (error) {
    console.error("upsertGoal Exception:", error);
    return false;
  }
};

export const deleteGoalDb = async (id: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) return true; // Se não for UUID, não está no banco ainda

    const { error } = await supabase.from('training_goals').delete().eq('id', id);
    return !error;
  } catch (error) {
    console.error("deleteGoalDb Error:", error);
    return false;
  }
};

/**
 * UTILS
 */
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const formatInterval = (interval: any): string => {
  if (!interval) return '00:00:00';
  if (typeof interval === 'string') return interval;
  const h = String(interval.hours || 0).padStart(2, '0');
  const m = String(interval.minutes || 0).padStart(2, '0');
  const s = String(interval.seconds || 0).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const calculatePace = (durationStr: string, distanceKm: number): string => {
  if (!distanceKm || distanceKm <= 0) return '--:--';
  const parts = durationStr.split(':').map(Number);
  let totalSeconds = 0;
  if (parts.length === 3) totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  else if (parts.length === 2) totalSeconds = (parts[0] * 60) + parts[1];
  if (totalSeconds <= 0) return '--:--';
  const secondsPerKm = totalSeconds / distanceKm;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const fetchWorkouts = async (): Promise<Workout[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data: runsData, error: runsError } = await supabase.from('runs').select('*').order('date', { ascending: false });
    if (runsError || !runsData) return [];
    const runIds = runsData.map((r: any) => r.id);
    if (runIds.length === 0) return [];
    const { data: lapsData } = await supabase.from('run_laps').select('*').in('run_id', runIds);
    return runsData.map((row: any) => {
      const relatedLaps = lapsData ? lapsData.filter((l: any) => l.run_id === row.id) : [];
      const duration = formatInterval(row.duration);
      const distance = parseFloat(row.distance_km) || 0;
      const mappedLaps: Lap[] = relatedLaps.map((lap: any) => ({
        lapNumber: lap.lap_number || lap.interval_index,
        duration: formatInterval(lap.duration),
        distance: parseFloat(lap.distance_km) || 0,
        avgPace: lap.avg_pace || calculatePace(formatInterval(lap.duration), parseFloat(lap.distance_km)),
        avgHR: lap.avg_heart_rate,
        cadence: parseFloat(lap.avg_cadence),
        strideLength: parseFloat(lap.avg_stride_length),
        verticalOscillation: lap.avg_vertical_oscillation ? parseFloat((parseFloat(lap.avg_vertical_oscillation) / 10).toFixed(1)) : 0,
        verticalRatio: parseFloat(lap.avg_vertical_ratio),
        groundContactTime: lap.avg_ground_contact_time?.toString()
      })).sort((a, b) => a.lapNumber - b.lapNumber);
      return {
        id: row.id,
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(row.date)),
        title: row.filename ? row.filename.replace('.md', '').replace(/_/g, ' ') : 'Treino Importado',
        type: 'Rodagem',
        distance: distance,
        duration: duration,
        avgPace: calculatePace(duration, distance),
        avgHR: row.avg_heart_rate || 0,
        maxHR: row.max_heart_rate,
        trainingLoad: row.training_load || 0,
        biomechanics: {
          cadence: parseFloat(row.avg_cadence) || 0,
          verticalOscillation: row.avg_vertical_oscillation ? parseFloat((parseFloat(row.avg_vertical_oscillation) / 10).toFixed(1)) : 0,
          groundContactTime: Math.round(parseFloat(row.ground_contact_time) || 0),
          strideLength: parseFloat(row.avg_stride_length) || 0,
        },
        laps: mappedLaps,
        aiAnalysis: row.ai_analysis
      };
    });
  } catch (error) { return []; }
};
