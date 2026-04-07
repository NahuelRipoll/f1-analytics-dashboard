import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin, Clock, ChevronRight, CheckCircle, Circle } from 'lucide-react'
import { getSchedule } from '../services/api'
import Spinner from '../components/ui/Spinner'
import YearSelector from '../components/ui/YearSelector'

export default function Calendar() {
  const [year, setYear] = useState(2025)

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', year],
    queryFn: () => getSchedule(year),
  })

  const today = new Date()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0f0f0' }}>
            Calendario <span style={{ color: '#e10600' }}>{year}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
            {schedule?.length ?? '—'} grandes premios
          </p>
        </div>
        <YearSelector value={year} onChange={setYear} />
      </div>

      {isLoading ? <Spinner /> : (
        <div className="grid gap-3">
          {schedule?.map(race => {
            const raceDate = new Date(race.date)
            const isPast = raceDate < today
            const isNext = schedule.find(r => new Date(r.date) >= today)?.round === race.round

            return (
              <div
                key={race.round}
                className="rounded-xl p-3 md:p-4 flex items-center gap-3 transition-colors"
                style={{
                  backgroundColor: isNext ? '#1a0000' : '#1a1a1a',
                  border: isNext ? '1px solid #e10600' : '1px solid #2e2e2e',
                  opacity: isPast && !isNext ? 0.7 : 1,
                }}
              >
                {/* Round number */}
                <div className="w-8 md:w-10 text-center flex-shrink-0">
                  <p className="text-xs" style={{ color: '#8a8a8a' }}>R</p>
                  <p className="text-base md:text-lg font-black" style={{ color: isNext ? '#e10600' : '#f0f0f0' }}>
                    {race.round}
                  </p>
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0">
                  {isPast
                    ? <CheckCircle size={16} style={{ color: '#358C75' }} />
                    : <Circle size={16} style={{ color: isNext ? '#e10600' : '#2e2e2e' }} />}
                </div>

                {/* Race info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate" style={{ color: '#f0f0f0' }}>{race.raceName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#8a8a8a' }}>
                      <MapPin size={10} />
                      {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#8a8a8a' }}>
                      <Clock size={10} />
                      {raceDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Circuit name */}
                <p className="hidden md:block text-xs text-right flex-shrink-0" style={{ color: '#8a8a8a', maxWidth: 160 }}>
                  {race.Circuit.circuitName}
                </p>

                {/* Link */}
                {isPast && (
                  <Link
                    to={`/race/${year}/${race.round}`}
                    className="flex items-center gap-1 text-xs font-medium px-2 md:px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0"
                    style={{ backgroundColor: '#242424', color: '#e10600', border: '1px solid #2e2e2e' }}
                  >
                    <span className="hidden sm:inline">Resultados</span>
                    <ChevronRight size={12} />
                  </Link>
                )}
                {isNext && (
                  <span className="text-xs font-bold px-2 md:px-3 py-1.5 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: '#e10600', color: '#fff' }}>
                    PRÓXIMA
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
