import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getDriverStandings, getDriverStandingsHistory } from '../services/api'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import YearSelector from '../components/ui/YearSelector'
import { TEAM_COLORS } from '../types/f1'

const COLORS = ['#e10600', '#3671C6', '#FF8000', '#00D2BE', '#DC0000', '#358C75', '#005AFF', '#FFD700', '#FF69B4', '#00FA9A']

export default function DriverStandings() {
  const [year, setYear] = useState(2025)
  const [showHistory, setShowHistory] = useState(false)

  const { data: standings, isLoading } = useQuery({
    queryKey: ['driver-standings', year],
    queryFn: () => getDriverStandings(year),
  })

  const { data: history, isLoading: hLoading } = useQuery({
    queryKey: ['driver-standings-history', year],
    queryFn: () => getDriverStandingsHistory(year),
    enabled: showHistory,
  })

  // Build chart data: one entry per round, points per driver
  const chartData = history?.map(entry => {
    const row: Record<string, number | string> = { round: `R${entry.round}` }
    entry.standings.forEach(s => {
      row[s.Driver.code ?? s.Driver.familyName] = Number(s.points)
    })
    return row
  })

  const topDrivers = standings?.slice(0, 10).map(s => s.Driver.code ?? s.Driver.familyName) ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0f0f0' }}>
            Campeonato <span style={{ color: '#e10600' }}>Pilotos</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>Clasificación general y evolución por carrera</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm px-4 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: showHistory ? '#e10600' : '#242424',
              color: showHistory ? '#fff' : '#8a8a8a',
              border: '1px solid #2e2e2e',
            }}
          >
            {showHistory ? 'Ocultar evolución' : 'Ver evolución'}
          </button>
          <YearSelector value={year} onChange={setYear} />
        </div>
      </div>

      {/* Points evolution chart */}
      {showHistory && (
        <Card title="Evolución de puntos por carrera">
          {hLoading ? <Spinner /> : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="round" stroke="#8a8a8a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a8a8a" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                  labelStyle={{ color: '#f0f0f0' }}
                  itemStyle={{ color: '#8a8a8a' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8a8a8a' }} />
                {topDrivers.map((driver, i) => (
                  <Line
                    key={driver}
                    type="monotone"
                    dataKey={driver}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm" style={{ color: '#8a8a8a' }}>Cargando historial...</p>}
        </Card>
      )}

      {/* Standings table */}
      <Card title={`Clasificación ${year}`}>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                  {['Pos', 'Piloto', 'Equipo', 'Pts', 'Victorias'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs uppercase tracking-wider font-medium"
                      style={{ color: '#8a8a8a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings?.map((s, i) => {
                  const teamColor = TEAM_COLORS[s.Constructors[0]?.constructorId ?? ''] ?? '#8a8a8a'
                  return (
                    <tr key={s.Driver.driverId}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #2e2e2e' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#242424')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="py-3 px-3 font-mono font-bold" style={{ color: i < 3 ? '#e10600' : '#8a8a8a' }}>
                        {s.position}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: teamColor }} />
                          <div>
                            <p className="font-semibold" style={{ color: '#f0f0f0' }}>
                              {s.Driver.givenName} {s.Driver.familyName}
                            </p>
                            <p className="text-xs" style={{ color: '#8a8a8a' }}>{s.Driver.nationality}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3" style={{ color: '#8a8a8a' }}>
                        {s.Constructors[0]?.name ?? '—'}
                      </td>
                      <td className="py-3 px-3 font-bold" style={{ color: '#f0f0f0' }}>{s.points}</td>
                      <td className="py-3 px-3" style={{ color: '#8a8a8a' }}>{s.wins}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
