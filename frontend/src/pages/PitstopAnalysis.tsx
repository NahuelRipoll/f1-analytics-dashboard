import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import {
  getPitstopTimingAnalysis, getStopsVsPosition,
  getFastestTeams, getStrategyByCircuit,
} from '../services/api'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import YearSelector from '../components/ui/YearSelector'

const STRATEGY_COLORS: Record<number, string> = { 1: '#00D2BE', 2: '#e10600', 3: '#FF8000', 4: '#8a8a8a' }

export default function PitstopAnalysis() {
  const [year, setYear] = useState(2024)
  const [round, setRound] = useState(1)

  const { data: timing, isLoading: tLoading } = useQuery({
    queryKey: ['pitstop-timing', year, round],
    queryFn: () => getPitstopTimingAnalysis(year, round),
  })

  const { data: stopsVsPos, isLoading: sLoading } = useQuery({
    queryKey: ['stops-vs-position'],
    queryFn: () => getStopsVsPosition([2018, 2019, 2020, 2021, 2022, 2023, 2024]),
  })

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['fastest-teams', year],
    queryFn: () => getFastestTeams(year),
  })

  const { data: circuitStrategy, isLoading: csLoading } = useQuery({
    queryKey: ['strategy-by-circuit'],
    queryFn: () => getStrategyByCircuit([2020, 2021, 2022, 2023, 2024]),
  })

  const radarData = circuitStrategy?.slice(0, 8).map(c => ({
    circuit: c.circuit.replace('Grand Prix', 'GP').slice(0, 20),
    '1 parada': c.strategy_distribution?.['1'] ?? 0,
    '2 paradas': c.strategy_distribution?.['2'] ?? 0,
    '3 paradas': c.strategy_distribution?.['3'] ?? 0,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0f0f0' }}>
            Análisis <span style={{ color: '#e10600' }}>Pitstops</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
            Cómo las paradas en boxes influyen en los resultados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm" style={{ color: '#8a8a8a' }}>Ronda:</label>
          <input
            type="number"
            min={1} max={24}
            value={round}
            onChange={e => setRound(Number(e.target.value))}
            className="w-16 text-sm px-2 py-1.5 rounded-lg outline-none"
            style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e', color: '#f0f0f0' }}
          />
          <YearSelector value={year} onChange={setYear} />
        </div>
      </div>

      {/* KPI row */}
      {timing && !tLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#8a8a8a' }}>Correlación vuelta/posición</p>
            <p className="text-3xl font-black mt-1" style={{ color: timing.correlation > 0 ? '#e10600' : '#00D2BE' }}>
              {timing.correlation?.toFixed(3) ?? '—'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#8a8a8a' }}>
              {timing.correlation > 0 ? 'Parar tarde → peor posición' : 'Parar antes → mejor resultado'}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#8a8a8a' }}>Pilotos con datos</p>
            <p className="text-3xl font-black mt-1" style={{ color: '#f0f0f0' }}>
              {timing.data_points?.length ?? '—'}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#8a8a8a' }}>Carreras analizadas (stops)</p>
            <p className="text-3xl font-black mt-1" style={{ color: '#f0f0f0' }}>
              {stopsVsPos?.summary?.reduce((a, b) => a + b.race_count, 0) ?? '—'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Scatter: timing vs position */}
        <Card title="Vuelta del 1er pitstop vs posición final" subtitle={`Carrera ${round} · ${year}`}>
          {tLoading ? <Spinner /> : timing?.data_points?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis
                  dataKey="lap" name="Vuelta" type="number"
                  stroke="#8a8a8a" tick={{ fontSize: 11 }}
                  label={{ value: 'Vuelta del pitstop', position: 'insideBottom', offset: -10, fill: '#8a8a8a', fontSize: 11 }}
                />
                <YAxis
                  dataKey="position" name="Posición" type="number" reversed
                  stroke="#8a8a8a" tick={{ fontSize: 11 }}
                  label={{ value: 'Posición final', angle: -90, position: 'insideLeft', fill: '#8a8a8a', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                  formatter={(v, name) => [v, name]}
                />
                <Scatter data={timing.data_points} fill="#e10600" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : <p className="text-sm" style={{ color: '#8a8a8a' }}>Sin datos para esta carrera.</p>}
        </Card>

        {/* Stops vs position */}
        <Card title="Nº de paradas vs posición promedio" subtitle="2018–2024 · todas las carreras">
          {sLoading ? <Spinner /> : stopsVsPos?.summary?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stopsVsPos.summary} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis
                  dataKey="num_stops"
                  stroke="#8a8a8a" tick={{ fontSize: 11 }}
                  tickFormatter={v => `${v} parada${v > 1 ? 's' : ''}`}
                />
                <YAxis stroke="#8a8a8a" tick={{ fontSize: 11 }} reversed
                  label={{ value: 'Pos. promedio', angle: -90, position: 'insideLeft', fill: '#8a8a8a', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                  labelStyle={{ color: '#f0f0f0' }}
                  cursor={{ fill: '#ffffff08' }}
                  formatter={(v) => [Number(v).toFixed(2), 'Posición promedio']}
                />
                <Bar dataKey="avg_position" radius={[4, 4, 0, 0]} name="Pos. promedio">
                  {stopsVsPos.summary.map(entry => (
                    <Cell key={entry.num_stops} fill={STRATEGY_COLORS[entry.num_stops] ?? '#8a8a8a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm" style={{ color: '#8a8a8a' }}>Cargando datos...</p>}
        </Card>
      </div>

      {/* Fastest teams */}
      {!teamsLoading && teams && teams.length > 0 && (
        <Card title={`Equipos más rápidos en boxes · ${year}`} subtitle="Duración promedio de pitstop (segundos)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                  {['Pos', 'Equipo', 'Promedio (s)', 'Mejor (s)', 'Total paradas'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs uppercase tracking-wider font-medium"
                      style={{ color: '#8a8a8a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #2e2e2e' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#242424')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td className="py-2.5 px-3 font-mono font-bold" style={{ color: i < 3 ? '#e10600' : '#8a8a8a' }}>
                      {i + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: '#f0f0f0' }}>
                      {t.constructorId}
                    </td>
                    <td className="py-2.5 px-3 font-mono" style={{ color: '#f0f0f0' }}>
                      {t.avg_duration?.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 font-mono" style={{ color: '#00D2BE' }}>
                      {t.best_duration?.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3" style={{ color: '#8a8a8a' }}>{t.total_stops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Strategy by circuit */}
      {!csLoading && circuitStrategy && circuitStrategy.length > 0 && (
        <Card title="Estrategia dominante por circuito" subtitle="2020–2024 · top 10 de cada carrera">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                    {['Circuito', 'Estrategia dom.', 'Promedio paradas'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs uppercase tracking-wider font-medium"
                        style={{ color: '#8a8a8a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {circuitStrategy.slice(0, 20).map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #2e2e2e' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#242424')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="py-2 px-2 text-xs" style={{ color: '#f0f0f0' }}>{c.circuit}</td>
                      <td className="py-2 px-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            backgroundColor: (STRATEGY_COLORS[c.dominant_strategy] ?? '#8a8a8a') + '33',
                            color: STRATEGY_COLORS[c.dominant_strategy] ?? '#8a8a8a',
                          }}>
                          {c.dominant_strategy} parada{c.dominant_strategy > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono text-xs" style={{ color: '#8a8a8a' }}>
                        {c.avg_stops_top10?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Radar chart */}
            {radarData && radarData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2e2e2e" />
                  <PolarAngleAxis dataKey="circuit" tick={{ fontSize: 9, fill: '#8a8a8a' }} />
                  <PolarRadiusAxis stroke="#2e2e2e" tick={{ fontSize: 9, fill: '#8a8a8a' }} />
                  <Radar name="1 parada" dataKey="1 parada" stroke="#00D2BE" fill="#00D2BE" fillOpacity={0.2} />
                  <Radar name="2 paradas" dataKey="2 paradas" stroke="#e10600" fill="#e10600" fillOpacity={0.2} />
                  <Radar name="3 paradas" dataKey="3 paradas" stroke="#FF8000" fill="#FF8000" fillOpacity={0.2} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
