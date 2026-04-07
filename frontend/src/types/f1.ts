export interface Driver {
  driverId: string
  permanentNumber?: string
  code?: string
  givenName: string
  familyName: string
  dateOfBirth?: string
  nationality?: string
}

export interface Constructor {
  constructorId: string
  name: string
  nationality?: string
}

export interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: Driver
  Constructors: Constructor[]
}

export interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: Constructor
}

export interface RaceResult {
  position: string
  points: string
  grid: string
  laps: string
  status: string
  Driver: Driver
  Constructor: Constructor
  FastestLap?: { rank: string; lap: string; Time: { time: string } }
  Time?: { time: string }
}

export interface QualifyingResult {
  position: string
  Driver: Driver
  Constructor: Constructor
  Q1?: string
  Q2?: string
  Q3?: string
}

export interface PitStop {
  driverId: string
  lap: string
  stop: string
  time: string
  duration: string
}

export interface Race {
  season: string
  round: string
  raceName: string
  date: string
  time?: string
  Circuit: {
    circuitId: string
    circuitName: string
    Location: {
      locality: string
      country: string
      lat: string
      long: string
    }
  }
  Results?: RaceResult[]
  QualifyingResults?: QualifyingResult[]
  PitStops?: PitStop[]
}

export interface StandingsHistoryEntry {
  round: number
  raceName: string
  standings: DriverStanding[]
}

// Analysis types
export interface PitstopTimingAnalysis {
  correlation: number
  avg_position_by_stop_lap: { lap_bucket: string; position: number }[]
  data_points: { driverId: string; lap: number; position: number }[]
}

export interface StopsVsPositionSummary {
  num_stops: number
  avg_position: number
  race_count: number
}

export interface StopsVsPosition {
  summary: StopsVsPositionSummary[]
  raw: { num_stops: number; position: number }[]
}

export interface TeamPitstopStat {
  constructorId: string
  avg_duration: number
  best_duration: number
  total_stops: number
}

export interface CircuitStrategy {
  circuit: string
  dominant_strategy: number
  avg_stops_top10: number
  strategy_distribution: Record<string, number>
}

export interface PredictionModel {
  trained: boolean
  feature_importance: Record<string, number>
  cv_mae: number
  cv_mae_std: number
  label_encoder_classes: string[]
}

// UI helper
export const TEAM_COLORS: Record<string, string> = {
  mercedes: '#00D2BE',
  ferrari: '#DC0000',
  red_bull: '#3671C6',
  mclaren: '#FF8000',
  aston_martin: '#358C75',
  alpine: '#0093CC',
  williams: '#005AFF',
  alphatauri: '#2B4562',
  rb: '#2B4562',
  alfa: '#900000',
  sauber: '#52E252',
  kick_sauber: '#52E252',
  haas: '#B6BABD',
  racing_point: '#F596C8',
  renault: '#FFF500',
  toro_rosso: '#469BFF',
  force_india: '#FF80C7',
  lotus_f1: '#FFB800',
}
