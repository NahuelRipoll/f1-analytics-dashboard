import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { getConstructorStandings } from '../services/api'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import YearSelector from '../components/ui/YearSelector'
import { TEAM_COLORS } from '../types/f1'

export default function ConstructorStandings() {
  const [year, setYear] = useState(2025)

  const { data: standings, isLoading } = useQuery({
    queryKey: ['constructor-standings', year],
    queryFn: () => getConstructorStandings(year),
  })

  const chartData = standings?.map(s => ({
    name: s.Constructor.name.replace(' F1 Team', '').replace(' Racing', ''),
    points: Number(s.points),
    constructorId: s.Constructor.constructorId,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0f0f0' }}>
            Campeonato <span style={{ color: '#e10600' }}>Constructores</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>Clasificación de equipos por temporada</p>
        </div>
        <YearSelector value={year} onChange={setYear} />
      </div>

      {/* Bar chart */}
      <Card title="Puntos por equipo">
        {isLoading ? <Spinner /> : chartData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#8a8a8a"
                tick={{ fontSize: 10, fill: '#8a8a8a' }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#8a8a8a" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                labelStyle={{ color: '#f0f0f0' }}
                cursor={{ fill: '#ffffff08' }}
              />
              <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.constructorId} fill={TEAM_COLORS[entry.constructorId] ?? '#8a8a8a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </Card>

      {/* Table */}
      <Card title={`Clasificación ${year}`}>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                  {['Pos', 'Equipo', 'Nacionalidad', 'Pts', 'Victorias'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs uppercase tracking-wider font-medium"
                      style={{ color: '#8a8a8a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings?.map((s, i) => {
                  const color = TEAM_COLORS[s.Constructor.constructorId] ?? '#8a8a8a'
                  return (
                    <tr key={s.Constructor.constructorId}
                      style={{ borderBottom: '1px solid #2e2e2e' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#242424')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="py-3 px-3 font-mono font-bold" style={{ color: i < 3 ? '#e10600' : '#8a8a8a' }}>
                        {s.position}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                          <span className="font-semibold" style={{ color: '#f0f0f0' }}>{s.Constructor.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3" style={{ color: '#8a8a8a' }}>{s.Constructor.nationality}</td>
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
