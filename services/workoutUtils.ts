import { Workout, UserProfile, Lap } from '../types';

/**
 * Converte pace (string "MM:SS") para segundos totais
 */
export const paceToSeconds = (pace: string): number => {
  if (!pace || pace === '--:--' || pace === '0:00' || pace === '00:00') return 0;
  const parts = pace.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

/**
 * Classifica o treino baseado no perfil do atleta e métricas detalhadas
 */
export const classifyWorkout = (workout: Workout, profile: UserProfile): string => {
  const distance = workout.distance || 0;
  const avgHR = workout.avgHR || 0;
  const thresholdHR = profile.lactateThresholdHR || 170;
  const thresholdPaceSec = paceToSeconds(profile.lactateThresholdPace || '5:00');
  const avgPaceSec = paceToSeconds(workout.avgPace);
  
  if (distance === 0) return 'Atividade';

  // 1. Longão (Volume alto)
  // Geralmente 25-30% acima da média de treinos ou > 16km para amadores avançados
  if (distance >= 16) return 'Longão';

  // Analisando Variabilidade de Laps para detectar Intervalados/Fartlek
  const laps = workout.laps || [];
  let paceVariability = 0;
  let hasHighIntensityLaps = false;

  if (laps.length > 2) {
    const validPaces = laps
      .map(l => paceToSeconds(l.avgPace))
      .filter(p => p > 60); // ignora laps parados ou erros

    if (validPaces.length > 0) {
      const minPace = Math.min(...validPaces);
      const maxPace = Math.max(...validPaces);
      paceVariability = (maxPace - minPace) / minPace;
      
      // Verifica se algum lap foi feito abaixo do pace de limiar (intensidade alta)
      hasHighIntensityLaps = validPaces.some(p => p < (thresholdPaceSec - 5));
    }
  }

  // 2. Intervalado (Alta variabilidade + tiros acima do limiar)
  if (paceVariability > 0.20 && hasHighIntensityLaps) {
    return 'Intervalado';
  }

  // 3. Fartlek (Variabilidade moderada em ritmo de rodagem)
  if (paceVariability > 0.15 && paceVariability <= 0.20) {
    return 'Fartlek';
  }

  // 4. Tempo Run (Esforço sustentado no limiar)
  // FC entre 90% e 105% do limiar E Pace próximo ao limiar
  const isThresholdHRZone = avgHR >= thresholdHR * 0.90 && avgHR <= thresholdHR * 1.05;
  const isNearThresholdPace = Math.abs(avgPaceSec - thresholdPaceSec) < 20;
  
  if (isThresholdHRZone && isNearThresholdPace && distance > 4) {
    return 'Tempo Run';
  }

  // 5. Regenerativo (Intensidade muito baixa)
  const isLowIntensityHR = avgHR > 0 && avgHR < thresholdHR * 0.80;
  const isSlowPace = avgPaceSec > thresholdPaceSec + 60;
  
  if (isLowIntensityHR && isSlowPace && distance < 10) {
    return 'Regenerativo';
  }

  // 6. Rodagem (O padrão: Z2/Z3 estável)
  // Se não se encaixou nos critérios acima, é uma corrida de base
  return 'Rodagem';
};