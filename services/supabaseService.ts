
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

/**
 * Converte segundos ou strings de tempo para o formato HH:MM:SS
 */
const formatDuration = (val: any): string => {
  if (!val) return '00:00:00';
  if (typeof val === 'string' && val.includes(':')) {
    const parts = val.split(':');
    if (parts.length === 2) return `00:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return val;
  }
  
  const totalSeconds = parseInt(val);
  if (isNaN(totalSeconds)) return '00:00:00';

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

/**
 * Converte duração para segundos totais.
 */
const toSeconds = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parts = val.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseInt(val) || 0;
  }
  return 0;
};

/**
 * Calcula o Pace (min/km) baseado em tempo e distância.
 */
const calculatePace = (timeVal: any, distanceKm: number): string => {
  if (!distanceKm || distanceKm <= 0) return '--:--';
  const totalSeconds = toSeconds(timeVal);
  if (totalSeconds <= 0) return '--:--';

  const secondsPerKm = totalSeconds / distanceKm;
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  
  if (mins > 59) return '--:--';
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

/**
 * Converte um timestamp UTC para string YYYY-MM-DD no fuso de Manaus.
 */
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

export const fetchWorkouts = async (): Promise<Workout[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data: runsData, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .order('date', { ascending: false });

    if (runsError) throw runsError;
    if (!runsData || runsData.length === 0) return [];

    const runIds = runsData.map(r => r.id);
    const { data: lapsData, error: lapsError } = await supabase
      .from('run_laps')
      .select('*')
      .in('run_id', runIds)
      .order('lap_number', { ascending: true });

    if (lapsError) console.error("Erro ao buscar voltas:", lapsError);

    return runsData.map((row: any) => {
      const workoutLaps = (lapsData || []).filter(l => l.run_id === row.id);
      
      const rawDuration = row.duration || row.total_timer_time || row.total_elapsed_time;
      const duration = formatDuration(rawDuration);
      let distance = parseFloat(row.distance_km || (row.total_distance ? row.total_distance / 1000 : 0));
      const avgPace = calculatePace(rawDuration, distance);

      return {
        id: row.id,
        date: row.date ? toManausDate(row.date) : '',
        title: row.filename ? row.filename.replace('.md', '').replace(/_/g, ' ') : 'Treino',
        type: 'Rodagem', 
        distance: distance,
        duration: duration,
        avgPace: avgPace,
        avgHR: row.avg_heart_rate || 0,
        maxHR: row.max_heart_rate || 0,
        trainingLoad: row.training_load || 0,
        elevationGain: row.elevation_gain || 0,
        aiAnalysis: row.ai_analysis,
        biomechanics: {
          cadence: row.avg_cadence || row.avg_running_cadence || 0,
          verticalOscillation: row.avg_vertical_oscillation ? parseFloat((row.avg_vertical_oscillation / 10).toFixed(1)) : 0,
          groundContactTime: row.avg_ground_contact_time || 0,
          strideLength: row.avg_stride_length || 0
        },
        laps: workoutLaps.map((lap: any) => {
          const lapDist = parseFloat(lap.distance_km || (lap.total_distance ? lap.total_distance / 1000 : 0));
          const lapDur = lap.duration || lap.total_timer_time || lap.total_elapsed_time;
          
          return {
            lapNumber: lap.lap_number,
            // PRIORIDADE: usar lap_type conforme solicitado pelo usuário, fallback para step_type
            stepType: lap.lap_type || lap.step_type,
            distance: lapDist,
            duration: formatDuration(lapDur),
            avgPace: calculatePace(lapDur, lapDist),
            avgHR: lap.avg_heart_rate,
            maxHR: lap.max_heart_rate,
            cadence: lap.avg_cadence || lap.avg_running_cadence,
            strideLength: lap.avg_stride_length,
            verticalOscillation: lap.avg_vertical_oscillation ? parseFloat((lap.avg_vertical_oscillation / 10).toFixed(1)) : 0,
            verticalRatio: lap.avg_vertical_ratio,
            groundContactTime: lap.avg_ground_contact_time
          };
        })
      };
    });
  } catch (error) { 
    console.error("fetchWorkouts error:", error);
    return []; 
  }
};

export const deleteAllWorkouts = async (): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    await supabase.from('run_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('run_laps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
