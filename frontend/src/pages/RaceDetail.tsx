import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getRaceDetail } from '../services/api'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { TEAM_COLORS } from '../types/f1'

export default function RaceDetail() {
  const { year, round } = useParams<{ year: string; round: string }>()
  const y = Number(year)
  const r = Number(round)

  const { data: race, isLoading } = useQuery({
    queryKey: ['race-detail', y, r],
    queryFn: () => getRaceDetail(y, r),
  })

  if (isLoading) return <Spinner />
  if (!race) return <p style={{ color: '#8a8a8a' }}>No hay datos para esta carrera.</p>

  const results = race.Results ?? []
  const pitstops = race.PitStops ?? []

  // Pitstop chart: stops per driver
  const stopCounts = pitstops.reduce<Record<string, number>>((acc, p) => {
    acc[p.driverId] = (acc[p.driverId] ?? 0) + 1
    return acc
  }, {})
  const stopChartData = Object.entries(stopCounts)
    .map(([driverId, stops]) => {
      const result = results.find(r => r.Driver.driverId === driverId)
      return {
        name: result?.Driver.code ?? driverId.slice(0, 3).toUpperCase(),
        stops,
        position: Number(result?.position ?? 99),
      }
    })
    .sort((a, b) => a.position - b.position)
    .slice(0, 20)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm" style={{ color: '#8a8a8a' }}>
          Ronda {race.round} · {race.season}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: '#f0f0f0' }}>{race.raceName}</h1>
        <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
          {race.Circuit.circuitName} · {race.Circuit.Location.locality}, {race.Circuit.Location.country}
        </p>
        <p className="text-sm mt-0.5" style={{ color: '#e10600' }}>
          {new Date(race.date).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Pitstops per driver chart */}
      {stopChartData.length > 0 && (
        <Card title="Paradas en boxes por piloto">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stopChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="name" stroke="#8a8a8a" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8a8a8a" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                labelStyle={{ color: '#f0f0f0' }}
                cursor={{ fill: '#ffffff08' }}
              />
              <Bar dataKey="stops" fill="#e10600" radius={[4, 4, 0, 0]} name="Paradas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Results table */}
        <Card title="Resultado de carrera">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                  {['Pos', 'Piloto', 'Equipo', 'Pts', 'Tiempo/Estado'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-xs uppercase tracking-wider font-medium"
                      style={{ color: '#8a8a8a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 20).map((r, i) => {
                  const color = TEAM_COLORS[r.Constructor.constructorId] ?? '#8a8a8a'
                  return (
                    <tr key={r.Driver.driverId} style={{ borderBottom: '1px solid #2e2e2e' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#242424')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="py-2 px-2 font-mono font-bold" style={{ color: i < 3 ? '#e10600' : '#8a8a8a' }}>
                        {r.position}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                          <span style={{ color: '#f0f0f0' }}>{r.Driver.code ?? r.Driver.familyName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs" style={{ color: '#8a8a8a' }}>{r.Constructor.name}</td>
                      <td className="py-2 px-2 font-semibold" style={{ color: '#f0f0f0' }}>{r.points}</td>
                      <td className="py-2 px-2 text-xs" style={{ color: '#8a8a8a' }}>
                        {r.Time?.time ?? r.status}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pitstops detail */}
        {pitstops.length > 0 && (
          <Card title="Detalle de pitstops">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                    {['Piloto', 'Parada', 'Vuelta', 'Duración'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs uppercase tracking-wider font-medium"
                        style={{ color: '#8a8a8a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pitstops.sort((a, b) => Number(a.lap) - Number(b.lap)).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #2e2e2e' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#242424')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="py-2 px-2" style={{ color: '#f0f0f0' }}>
                        {results.find(r => r.Driver.driverId === p.driverId)?.Driver.code ?? p.driverId}
                      </td>
                      <td className="py-2 px-2 font-mono" style={{ color: '#8a8a8a' }}>#{p.stop}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: '#f0f0f0' }}>V{p.lap}</td>
                      <td className="py-2 px-2 font-mono text-xs" style={{ color: '#e10600' }}>{p.duration}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Qualifying */}
      {race.QualifyingResults && race.QualifyingResults.length > 0 && (
        <Card title="Clasificación">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                  {['Pos', 'Piloto', 'Equipo', 'Q1', 'Q2', 'Q3'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-xs uppercase tracking-wider font-medium"
                      style={{ color: '#8a8a8a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {race.QualifyingResults.map((q, i) => {
                  const color = TEAM_COLORS[q.Constructor.constructorId] ?? '#8a8a8a'
                  return (
                    <tr key={q.Driver.driverId} style={{ borderBottom: '1px solid #2e2e2e' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#242424')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="py-2 px-2 font-mono font-bold" style={{ color: i < 3 ? '#e10600' : '#8a8a8a' }}>
                        {q.position}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                          <span style={{ color: '#f0f0f0' }}>{q.Driver.code ?? q.Driver.familyName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs" style={{ color: '#8a8a8a' }}>{q.Constructor.name}</td>
                      <td className="py-2 px-2 font-mono text-xs" style={{ color: '#8a8a8a' }}>{q.Q1 ?? '—'}</td>
                      <td className="py-2 px-2 font-mono text-xs" style={{ color: '#8a8a8a' }}>{q.Q2 ?? '—'}</td>
                      <td className="py-2 px-2 font-mono text-xs" style={{ color: '#e10600' }}>{q.Q3 ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
