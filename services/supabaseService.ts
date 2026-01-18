import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Workout, Lap, UserProfile } from '../types';

// Credenciais fornecidas pelo usuário como fallback para garantir a conexão
const SUPABASE_URL = process.env.SUPABASE_URL || "https://lmuphzeagwusflvwadge.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_fAlU4gn7vGt-PpDr-c88KA_Vp23vAiE";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Obtém a instância do Supabase de forma segura.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  
  // Verifica se as chaves são válidas
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
 * Busca o perfil mais recente cadastrado na tabela 'profiles'
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

    if (error) {
      console.error("Erro Supabase ao buscar perfil:", error.message);
      return null;
    }

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
  } catch (error: any) {
    console.error("Erro inesperado no fetchLatestProfile:", error);
    return null;
  }
};

/**
 * Salva novo perfil
 */
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
    console.error("Erro ao salvar perfil no Supabase:", error);
    return false;
  }
};

// Funções auxiliares de formatação
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

/**
 * Busca os treinos das tabelas 'runs' e 'run_laps'.
 */
export const fetchWorkouts = async (): Promise<Workout[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    // 1. Busca os dados gerais da corrida (Cabeçalho)
    const { data: runsData, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .order('date', { ascending: false });

    if (runsError || !runsData) {
      console.warn("Nenhum treino encontrado na tabela 'runs'.");
      return [];
    }

    const runIds = runsData.map((r: any) => r.id);
    if (runIds.length === 0) return [];

    // 2. Busca as voltas (Laps) relacionadas
    const { data: lapsData } = await supabase
      .from('run_laps')
      .select('*')
      .in('run_id', runIds);

    // 3. Monta o objeto Workout
    return runsData.map((row: any) => {
      const relatedLaps = lapsData ? lapsData.filter((l: any) => l.run_id === row.id) : [];
      const duration = formatInterval(row.duration);
      const distance = parseFloat(row.distance_km) || 0;
      
      const mappedLaps: Lap[] = relatedLaps.map((lap: any) => {
        const lapDuration = formatInterval(lap.duration);
        const lapDistance = parseFloat(lap.distance_km) || 0;
        
        // Calcula o pace usando tempo e distância para garantir precisão
        let calculatedPace = calculatePace(lapDuration, lapDistance);
        
        // Se o cálculo falhar (distância 0), tenta usar o valor do banco se existir
        if (calculatedPace === '--:--' && lap.avg_pace && lap.avg_pace !== '00:00' && lap.avg_pace !== '0:00') {
           calculatedPace = lap.avg_pace;
        }

        return {
          lapNumber: lap.lap_number || lap.interval_index,
          duration: lapDuration,
          distance: lapDistance,
          avgPace: calculatedPace,
          avgHR: lap.avg_heart_rate,
          avgPower: parseFloat(lap.avg_power),
          strideLength: parseFloat(lap.avg_stride_length),
          verticalOscillation: parseFloat(lap.avg_vertical_oscillation),
        };
      }).sort((a, b) => a.lapNumber - b.lapNumber);

      // Função auxiliar para calcular média das voltas caso o dado principal esteja faltando
      const getAverageFromLaps = (laps: any[], key: string): number => {
        if (!laps || laps.length === 0) return 0;
        const validLaps = laps.filter(l => l[key] !== null && l[key] !== undefined && parseFloat(l[key]) > 0);
        if (validLaps.length === 0) return 0;
        const total = validLaps.reduce((sum, lap) => sum + parseFloat(lap[key]), 0);
        return total / validLaps.length;
      };

      // Recupera dados com fallback para laps se estiver zerado no header
      const avgCadence = parseFloat(row.avg_cadence) || Math.round(getAverageFromLaps(relatedLaps, 'avg_cadence'));
      const avgVertOsc = parseFloat(row.avg_vertical_oscillation) || getAverageFromLaps(relatedLaps, 'avg_vertical_oscillation');
      const avgStride = parseFloat(row.avg_stride_length) || getAverageFromLaps(relatedLaps, 'avg_stride_length');
      
      // Tenta recuperar FC Média das voltas se não tiver no header
      const avgHR = row.avg_heart_rate || Math.round(getAverageFromLaps(relatedLaps, 'avg_heart_rate'));
      
      // Tenta recuperar GCT das voltas
      const avgGCT = parseFloat(row.avg_ground_contact_time) || Math.round(getAverageFromLaps(relatedLaps, 'avg_ground_contact_time'));

      return {
        id: row.id,
        date: new Date(row.date).toISOString().split('T')[0],
        title: row.filename ? row.filename.replace('.md', '').replace(/_/g, ' ') : 'Treino Importado',
        type: 'Rodagem', 
        distance: distance,
        duration: duration,
        avgPace: calculatePace(duration, distance),
        avgHR: avgHR || 0,
        maxHR: row.max_heart_rate,
        trainingLoad: row.training_load || 0,
        biomechanics: {
          cadence: avgCadence,
          verticalOscillation: parseFloat(avgVertOsc.toFixed(2)),
          groundContactTime: Math.round(avgGCT),
          strideLength: parseFloat(avgStride.toFixed(2)),
        },
        laps: mappedLaps,
        aiAnalysis: row.ai_analysis
      };
    });
  } catch (error) {
    console.error("Erro fetchWorkouts:", error);
    return [];
  }
};