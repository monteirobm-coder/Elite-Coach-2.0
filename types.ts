
export interface HRZones {
  z1Low: number;
  z1High: number;
  z2High: number;
  z3High: number;
  z4High: number;
}

export interface PersonalRecords {
  k5: string;
  k10: string;
  k21: string;
  k42: string;
}

export interface UserProfile {
  name: string;
  birthDate: string;
  age: number;
  weight: number;
  height: number;
  bodyFat: number;
  restingHR: number;
  maxHR: number;
  vo2Max: number;
  lactateThresholdPace: string;
  lactateThresholdHR: number;
  hrZones: HRZones;
  prs: PersonalRecords;
  experience: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Elite';
  photoUrl?: string;
}

export interface Biomechanics {
  cadence: number;
  verticalOscillation: number;
  groundContactTime: number | string;
  strideLength: number;
}

export interface Lap {
  lapNumber: number;
  stepType?: string;
  duration: string;
  cumulativeTime?: string;
  distance: number;
  avgPace: string;
  avgGap?: string;
  avgHR?: number;
  maxHR?: number;
  totalAscent?: number;
  totalDescent?: number;
  cadence?: number;
  maxCadence?: number;
  groundContactTime?: string;
  strideLength?: number;
  verticalOscillation?: number;
  verticalRatio?: number;
  normalizedPower?: number;
  avgPower?: number;
  maxPower?: number;
  avgWkg?: number;
  maxWkg?: number;
  calories?: number;
  avgTemp?: number;
  bestPace?: string;
  movingTime?: string;
  avgMovingPace?: string;
}

export interface Workout {
  id: string;
  date: string;
  title: string;
  type: string;
  distance: number;
  duration: string;
  avgPace: string;
  avgHR: number;
  maxHR?: number;
  trainingLoad: number;
  elevationGain?: number;
  avgPower?: number;
  maxPower?: number;
  biomechanics?: Biomechanics;
  laps?: Lap[];
  aiAnalysis?: string;
  filename?: string;
}

export interface TrainingGoal {
  id: string;
  title: string;
  targetDate: string;
  targetValue: string;
  targetDistance?: number;
  targetPace?: string;
  progress: number;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  distance: string;
  location: string;
  status: 'Inscrito' | 'Planejado' | 'Interessado';
}
