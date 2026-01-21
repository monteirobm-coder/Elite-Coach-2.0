
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Workout, Lap, UserProfile, TrainingGoal } from '../types';

// Credenciais fornecidas pelo usuário como fallback para garantir a conexão
const SUPABASE_URL = process.env.SUPABASE_URL || "https://lmuphzeagwusflvwadge.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_fAlU4gn7vGt-PpDr-c88KA_Vp23vAiE";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Obtém a instância do Supabase de forma segura.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL === 'undefined') {
    console.warn("Supabase: Chaves de configuração inválidas.");
    return null;
  }

  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabaseInstance;
  } catch (error) {
    console.error("Erro ao inicializar Supabase:", error);
    return null;
  }
};

/**
 * Busca o perfil mais recente
 */
export const fetchLatestProfile = async (): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    if (!data) return null;

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
  } catch (error) {
    return null;
  }
};

export const saveProfile = async (profile: UserProfile): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .insert([{
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
  } catch (error) {
    return false;
  }
};

/**
 * Funções para Metas (Training Goals)
 */

export const fetchGoals = async (): Promise<TrainingGoal[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('training_goals')
      .select('*')
      .order('target_date', { ascending: true });

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
    const payload: any = {
      title: goal.title,
      target_date: goal.targetDate,
      target_value: goal.targetValue,
      target_distance: goal.targetDistance,
      target_pace: goal.targetPace,
      progress: goal.progress
    };

    // Se o ID for um UUID válido (veio do DB), incluímos para o upsert
    if (goal.id && goal.id.includes('-')) {
      payload.id = goal.id;
    }

    const { error } = await supabase
      .from('training_goals')
      .upsert([payload]);
    
    return !error;
  } catch (error) {
    console.error("upsertGoal Error:", error);
    return false;
  }
};

export const deleteGoalDb = async (id: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('training_goals')
      .delete()
      .eq('id', id);
    return !error;
  } catch (error) {
    console.error("deleteGoalDb Error:", error);
    return false;
  }
};

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
    const { data: runsData, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .order('date', { ascending: false });

    if (runsError || !runsData) return [];

    const runIds = runsData.map((r: any) => r.id);
    if (runIds.length === 0) return [];

    const { data: lapsData } = await supabase
      .from('run_laps')
      .select('*')
      .in('run_id', runIds);

    return runsData.map((row: any) => {
      const relatedLaps = lapsData ? lapsData.filter((l: any) => l.run_id === row.id) : [];
      const duration = formatInterval(row.duration);
      const distance = parseFloat(row.distance_km) || 0;
      
      const mappedLaps: Lap[] = relatedLaps.map((lap: any) => {
        const lapDuration = formatInterval(lap.duration);
        const lapDistance = parseFloat(lap.distance_km) || 0;
        let calculatedPace = calculatePace(lapDuration, lapDistance);
        if (calculatedPace === '--:--' && lap.avg_pace && lap.avg_pace !== '00:00') {
           calculatedPace = lap.avg_pace;
        }

        return {
          lapNumber: lap.lap_number || lap.interval_index,
          duration: lapDuration,
          distance: lapDistance,
          avgPace: calculatedPace,
          avgHR: lap.avg_heart_rate,
          cadence: parseFloat(lap.avg_cadence),
          strideLength: parseFloat(lap.avg_stride_length),
          verticalOscillation: lap.avg_vertical_oscillation ? parseFloat((parseFloat(lap.avg_vertical_oscillation) / 10).toFixed(1)) : 0,
          verticalRatio: parseFloat(lap.avg_vertical_ratio),
          groundContactTime: lap.avg_ground_contact_time?.toString()
        };
      }).sort((a, b) => a.lapNumber - b.lapNumber);

      const getAverageFromLaps = (laps: any[], key: string): number => {
        if (!laps || laps.length === 0) return 0;
        const validLaps = laps.filter(l => l[key] !== null && l[key] !== undefined && parseFloat(l[key]) > 0);
        if (validLaps.length === 0) return 0;
        return validLaps.reduce((sum, lap) => sum + parseFloat(lap[key]), 0) / validLaps.length;
      };

      const dateOnly = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Manaus',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(row.date));

      const rawOscillation = parseFloat(row.avg_vertical_oscillation) || getAverageFromLaps(relatedLaps, 'avg_vertical_oscillation');
      const correctedOscillation = rawOscillation > 0 ? parseFloat((rawOscillation / 10).toFixed(1)) : 0;

      return {
        id: row.id,
        date: dateOnly, 
        title: row.filename ? row.filename.replace('.md', '').replace(/_/g, ' ') : 'Treino Importado',
        type: 'Rodagem', 
        distance: distance,
        duration: duration,
        avgPace: calculatePace(duration, distance),
        avgHR: row.avg_heart_rate || Math.round(getAverageFromLaps(relatedLaps, 'avg_heart_rate')),
        maxHR: row.max_heart_rate,
        trainingLoad: row.training_load || 0,
        biomechanics: {
          cadence: parseFloat(row.avg_cadence) || Math.round(getAverageFromLaps(relatedLaps, 'avg_cadence')),
          verticalOscillation: correctedOscillation,
          groundContactTime: Math.round(parseFloat(row.ground_contact_time) || getAverageFromLaps(relatedLaps, 'avg_ground_contact_time')),
          strideLength: parseFloat(row.avg_stride_length) || parseFloat(getAverageFromLaps(relatedLaps, 'avg_stride_length').toFixed(2)),
        },
        laps: mappedLaps,
        aiAnalysis: row.ai_analysis
      };
    });
  } catch (error) {
    console.error("fetchWorkouts Error:", error);
    return [];
  }
};
