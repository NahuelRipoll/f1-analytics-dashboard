import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trophy, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { getDriverStandings, getConstructorStandings, getSchedule } from '../services/api'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { TEAM_COLORS } from '../types/f1'

const CURRENT_YEAR = 2025

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-xl p-5 flex items-center gap-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: '#f0f0f0' }}>{value}</p>
        <p className="text-xs" style={{ color: '#8a8a8a' }}>{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: drivers, isLoading: dLoading } = useQuery({
    queryKey: ['driver-standings', CURRENT_YEAR],
    queryFn: () => getDriverStandings(CURRENT_YEAR),
  })
  const { data: constructors, isLoading: cLoading } = useQuery({
    queryKey: ['constructor-standings', CURRENT_YEAR],
    queryFn: () => getConstructorStandings(CURRENT_YEAR),
  })
  const { data: schedule } = useQuery({
    queryKey: ['schedule', CURRENT_YEAR],
    queryFn: () => getSchedule(CURRENT_YEAR),
  })

  const today = new Date()
  const nextRace = schedule?.find(r => new Date(r.date) >= today)
  const lastRace = schedule?.filter(r => new Date(r.date) < today).at(-1)
  const completedRaces = schedule?.filter(r => new Date(r.date) < today).length ?? 0

  const leader = drivers?.[0]
  const teamLeader = constructors?.[0]
  const teamColor = TEAM_COLORS[leader?.Constructors?.[0]?.constructorId ?? ''] ?? '#e10600'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0f0f0' }}>
          Temporada <span style={{ color: '#e10600' }}>{CURRENT_YEAR}</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
          {completedRaces} carreras completadas
          {nextRace && ` · Próxima: ${nextRace.raceName}`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Carreras completadas" value={completedRaces} icon={Calendar} color="#e10600" />
        <StatCard label="Pilotos en grilla" value={drivers?.length ?? '—'} icon={Users} color="#3671C6" />
        <StatCard label="Equipos" value={constructors?.length ?? '—'} icon={Trophy} color="#FF8000" />
        <StatCard label="Temporadas analizadas" value="2015–2025" icon={TrendingUp} color="#00D2BE" />
      </div>

      {/* Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver leader */}
        <Card title="Líder campeonato pilotos">
          {dLoading ? <Spinner /> : leader ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                style={{ backgroundColor: teamColor + '33', color: teamColor }}>
                {leader.Driver.code ?? leader.Driver.familyName.slice(0, 3).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg" style={{ color: '#f0f0f0' }}>
                  {leader.Driver.givenName} {leader.Driver.familyName}
                </p>
                <p className="text-sm" style={{ color: '#8a8a8a' }}>
                  {leader.Constructors[0]?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: '#e10600' }}>{leader.points}</p>
                <p className="text-xs" style={{ color: '#8a8a8a' }}>puntos</p>
              </div>
            </div>
          ) : <p style={{ color: '#8a8a8a' }}>Sin datos</p>}
          <div className="mt-4 space-y-2">
            {drivers?.slice(0, 5).map((d, i) => (
              <div key={d.Driver.driverId} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-right font-mono" style={{ color: '#8a8a8a' }}>{i + 1}</span>
                <span className="flex-1" style={{ color: '#f0f0f0' }}>
                  {d.Driver.givenName} {d.Driver.familyName}
                </span>
                <span className="font-semibold" style={{ color: '#f0f0f0' }}>{d.points}</span>
              </div>
            ))}
          </div>
          <Link to="/drivers" className="mt-4 flex items-center gap-1 text-xs font-medium"
            style={{ color: '#e10600' }}>
            Ver todos los pilotos <ChevronRight size={12} />
          </Link>
        </Card>

        {/* Constructor leader */}
        <Card title="Líder campeonato constructores">
          {cLoading ? <Spinner /> : teamLeader ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                style={{
                  backgroundColor: (TEAM_COLORS[teamLeader.Constructor.constructorId] ?? '#e10600') + '33',
                  color: TEAM_COLORS[teamLeader.Constructor.constructorId] ?? '#e10600',
                }}>
                {teamLeader.Constructor.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg" style={{ color: '#f0f0f0' }}>{teamLeader.Constructor.name}</p>
                <p className="text-sm" style={{ color: '#8a8a8a' }}>{teamLeader.wins} victorias · {teamLeader.Constructor.nationality}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: '#e10600' }}>{teamLeader.points}</p>
                <p className="text-xs" style={{ color: '#8a8a8a' }}>puntos</p>
              </div>
            </div>
          ) : <p style={{ color: '#8a8a8a' }}>Sin datos</p>}
          <div className="mt-4 space-y-2">
            {constructors?.slice(0, 5).map((c, i) => (
              <div key={c.Constructor.constructorId} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-right font-mono" style={{ color: '#8a8a8a' }}>{i + 1}</span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TEAM_COLORS[c.Constructor.constructorId] ?? '#8a8a8a' }}
                />
                <span className="flex-1" style={{ color: '#f0f0f0' }}>{c.Constructor.name}</span>
                <span className="font-semibold" style={{ color: '#f0f0f0' }}>{c.points}</span>
              </div>
            ))}
          </div>
          <Link to="/constructors" className="mt-4 flex items-center gap-1 text-xs font-medium"
            style={{ color: '#e10600' }}>
            Ver todos los equipos <ChevronRight size={12} />
          </Link>
        </Card>
      </div>

      {/* Next & last race */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nextRace && (
          <Card title="Próxima carrera" accent>
            <div>
              <p className="text-xl font-bold" style={{ color: '#f0f0f0' }}>{nextRace.raceName}</p>
              <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
                {nextRace.Circuit.Location.locality}, {nextRace.Circuit.Location.country}
              </p>
              <p className="text-sm mt-1" style={{ color: '#e10600' }}>
                {new Date(nextRace.date).toLocaleDateString('es-AR', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </Card>
        )}
        {lastRace && (
          <Card title="Última carrera">
            <div>
              <p className="text-xl font-bold" style={{ color: '#f0f0f0' }}>{lastRace.raceName}</p>
              <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
                {lastRace.Circuit.Location.locality}, {lastRace.Circuit.Location.country}
              </p>
              <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
                {new Date(lastRace.date).toLocaleDateString('es-AR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              <Link
                to={`/race/${CURRENT_YEAR}/${lastRace.round}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: '#e10600' }}
              >
                Ver resultados <ChevronRight size={12} />
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
