
import { Workout, UserProfile, Lap } from '../types';

/**
 * Converte pace (string "MM:SS") para segundos totais
 */
export const paceToSeconds = (pace: string): number => {
  if (!pace || pace === '--:--') return 0;
  const parts = pace.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

/**
 * Classifica o treino baseado no perfil do atleta e métricas do Garmin
 */
export const classifyWorkout = (workout: Workout, profile: UserProfile): string => {
  const distance = workout.distance || 0;
  const avgHR = workout.avgHR || 0;
  const thresholdHR = profile.lactateThresholdHR || 170;
  const thresholdPaceSec = paceToSeconds(profile.lactateThresholdPace || '5:00');
  const avgPaceSec = paceToSeconds(workout.avgPace);
  
  // Zonas de FC simplificadas baseadas no limiar de lactato (Z4 costuma ser 95-100% do limiar)
  const isZ4 = avgHR >= thresholdHR * 0.94 && avgHR <= thresholdHR * 1.05;
  const isZ1Z2 = avgHR < thresholdHR * 0.85;
  const isZ5 = avgHR > thresholdHR * 1.05;

  // 1. Longão (Volume alto, intensidade moderada)
  if (distance >= 16) return 'Longão';

  // 2. Intervalado (Variabilidade de ritmo e FC alta)
  const hasIntervalLaps = workout.laps?.some(l => 
    l.stepType?.toLowerCase().includes('interval') || 
    l.stepType?.toLowerCase().includes('active')
  );
  
  // Cálculo de variabilidade de pace entre as voltas (laps)
  if (workout.laps && workout.laps.length > 3) {
    const paces = workout.laps.map(l => paceToSeconds(l.avgPace)).filter(p => p > 0);
    if (paces.length > 0) {
      const maxPace = Math.max(...paces);
      const minPace = Math.min(...paces);
      // Se a diferença entre o lap mais rápido e o mais lento for > 25%, provavelmente é intervalado
      if (hasIntervalLaps || (maxPace - minPace) / minPace > 0.25) return 'Intervalado';
    }
  }

  // 3. Tempo Run (Perto do limiar de lactato por tempo prolongado)
  const isNearThresholdPace = Math.abs(avgPaceSec - thresholdPaceSec) < 15; // +/- 15 segundos do pace de limiar
  if (isZ4 && isNearThresholdPace && distance > 5) return 'Tempo Run';

  // 4. Regenerativo (FC baixa e curta duração)
  const durationMinutes = paceToSeconds(workout.duration) / 60;
  if (isZ1Z2 && durationMinutes < 45 && avgPaceSec > thresholdPaceSec + 60) return 'Regenerativo';

  // 5. Fartlek (Variação de ritmo sem descanso passivo)
  if (workout.laps && workout.laps.length > 5 && !isZ1Z2 && !isZ4) {
    return 'Fartlek';
  }

  // 6. Rodagem (O padrão: Z2/Z3 estável)
  return 'Rodagem';
};
