import axios from 'axios'
import type {
  DriverStanding, ConstructorStanding, Race, PitStop,
  StandingsHistoryEntry, PitstopTimingAnalysis, StopsVsPosition,
  TeamPitstopStat, CircuitStrategy, PredictionModel,
} from '../types/f1'

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

// Standings
export const getDriverStandings = (year: number, round?: number) =>
  http.get<DriverStanding[]>(`/standings/drivers/${year}`, { params: round ? { round } : {} }).then(r => r.data)

export const getConstructorStandings = (year: number, round?: number) =>
  http.get<ConstructorStanding[]>(`/standings/constructors/${year}`, { params: round ? { round } : {} }).then(r => r.data)

export const getDriverStandingsHistory = (year: number) =>
  http.get<StandingsHistoryEntry[]>(`/standings/drivers/${year}/history`).then(r => r.data)

// Races
export const getSchedule = (year: number) =>
  http.get<Race[]>(`/races/schedule/${year}`).then(r => r.data)

export const getRaceDetail = (year: number, round: number) =>
  http.get<Race>(`/races/${year}/${round}/results`).then(r => r.data)

export const getSeasonResults = (year: number) =>
  http.get<Race[]>(`/races/${year}/results`).then(r => r.data)

// Pitstops
export const getPitstops = (year: number, round: number) =>
  http.get<PitStop[]>(`/pitstops/${year}/${round}`).then(r => r.data)

// Analysis
export const getPitstopTimingAnalysis = (year: number, round: number) =>
  http.get<PitstopTimingAnalysis>(`/analysis/pitstop-timing/${year}/${round}`).then(r => r.data)

export const getStopsVsPosition = (years?: number[]) =>
  http.get<StopsVsPosition>('/analysis/stops-vs-position', {
    params: years ? { years } : {},
    paramsSerializer: p => Object.entries(p).map(([k, v]) =>
      Array.isArray(v) ? v.map(x => `${k}=${x}`).join('&') : `${k}=${v}`
    ).join('&'),
  }).then(r => r.data)

export const getFastestTeams = (year: number) =>
  http.get<TeamPitstopStat[]>(`/analysis/fastest-teams/${year}`).then(r => r.data)

export const getStrategyByCircuit = (years?: number[]) =>
  http.get<CircuitStrategy[]>('/analysis/strategy-by-circuit', {
    params: years ? { years } : {},
    paramsSerializer: p => Object.entries(p).map(([k, v]) =>
      Array.isArray(v) ? v.map(x => `${k}=${x}`).join('&') : `${k}=${v}`
    ).join('&'),
  }).then(r => r.data)

export const getPredictionModel = (years?: number[]) =>
  http.get<PredictionModel>('/analysis/predict-model', {
    params: years ? { years } : {},
    paramsSerializer: p => Object.entries(p).map(([k, v]) =>
      Array.isArray(v) ? v.map(x => `${k}=${x}`).join('&') : `${k}=${v}`
    ).join('&'),
  }).then(r => r.data)
