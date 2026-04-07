import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { getPredictionModel } from '../services/api'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { Brain, AlertTriangle } from 'lucide-react'

const FEATURE_LABELS: Record<string, string> = {
  qual_pos: 'Posición de clasificación',
  num_stops: 'Número de paradas',
  first_stop_lap: 'Vuelta del 1er pitstop',
  circuit_enc: 'Circuito',
}

const TRAINING_YEARS = [2018, 2019, 2020, 2021, 2022, 2023]

export default function Predictions() {
  const [trained, setTrained] = useState(false)

  const { data: model, isLoading, refetch } = useQuery({
    queryKey: ['prediction-model'],
    queryFn: () => getPredictionModel(TRAINING_YEARS),
    enabled: trained,
  })

  const importanceData = model?.feature_importance
    ? Object.entries(model.feature_importance)
        .map(([k, v]) => ({ feature: FEATURE_LABELS[k] ?? k, importance: Number((v * 100).toFixed(2)) }))
        .sort((a, b) => b.importance - a.importance)
    : []

  const COLORS = ['#e10600', '#FF8000', '#3671C6', '#00D2BE']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0f0f0' }}>
          Predicciones <span style={{ color: '#e10600' }}>ML</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
          Modelo entrenado con datos 2018–2023 · Gradient Boosting Regressor
        </p>
      </div>

      {/* Info card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#e1060022' }}>
            <Brain size={20} style={{ color: '#e10600' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#f0f0f0' }}>¿Cómo funciona el modelo?</h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#8a8a8a' }}>
              Se usa un <strong style={{ color: '#f0f0f0' }}>Gradient Boosting Regressor</strong> para predecir la
              posición final de cada piloto. Las features utilizadas son:
            </p>
            <ul className="mt-3 space-y-1.5">
              {Object.entries(FEATURE_LABELS).map(([k, v]) => (
                <li key={k} className="flex items-center gap-2 text-sm" style={{ color: '#8a8a8a' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e10600' }} />
                  <strong style={{ color: '#f0f0f0' }}>{v}</strong>
                </li>
              ))}
            </ul>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: '#8a8a8a' }}>
              El modelo se evalúa con <strong style={{ color: '#f0f0f0' }}>cross-validation de 5 folds</strong>,
              usando MAE (Mean Absolute Error) como métrica. Un MAE de ~3 significa que el modelo
              predice la posición final con un error promedio de ±3 puestos.
            </p>
          </div>
        </div>
      </Card>

      {/* Warning */}
      <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: '#1a1400', border: '1px solid #3a2e00' }}>
        <AlertTriangle size={16} style={{ color: '#FF8000', flexShrink: 0, marginTop: 1 }} />
        <p className="text-sm" style={{ color: '#8a8a8a' }}>
          El entrenamiento puede tardar varios minutos ya que descarga y procesa datos de ~{TRAINING_YEARS.length * 24} carreras.
          Los datos se cachean en SQLite para futuras consultas.
        </p>
      </div>

      {/* Train button */}
      {!trained && (
        <button
          onClick={() => { setTrained(true); refetch() }}
          className="px-6 py-3 rounded-xl font-semibold text-white transition-colors flex items-center gap-2"
          style={{ backgroundColor: '#e10600' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c40500')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e10600')}
        >
          <Brain size={18} />
          Entrenar modelo
        </button>
      )}

      {isLoading && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-4">
            <Spinner size={32} />
            <p style={{ color: '#8a8a8a' }}>Entrenando modelo... esto puede tardar unos minutos</p>
            <p className="text-xs" style={{ color: '#8a8a8a' }}>Descargando y procesando datos de {TRAINING_YEARS.length} temporadas</p>
          </div>
        </Card>
      )}

      {model && !isLoading && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#1a1a1a', border: model.trained ? '1px solid #358C75' : '1px solid #e10600' }}>
              <p className="text-xs uppercase tracking-wider" style={{ color: '#8a8a8a' }}>Estado</p>
              <p className="text-2xl font-black mt-1" style={{ color: model.trained ? '#358C75' : '#e10600' }}>
                {model.trained ? 'Entrenado' : 'Sin datos'}
              </p>
            </div>
            {model.trained && (
              <>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
                  <p className="text-xs uppercase tracking-wider" style={{ color: '#8a8a8a' }}>MAE promedio (CV)</p>
                  <p className="text-2xl font-black mt-1" style={{ color: '#f0f0f0' }}>
                    ±{model.cv_mae?.toFixed(2)} pos.
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
                  <p className="text-xs uppercase tracking-wider" style={{ color: '#8a8a8a' }}>Desviación MAE</p>
                  <p className="text-2xl font-black mt-1" style={{ color: '#f0f0f0' }}>
                    ±{model.cv_mae_std?.toFixed(2)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Feature importance */}
          {importanceData.length > 0 && (
            <Card title="Importancia de features" subtitle="Qué factores impactan más en el resultado final">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={importanceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
                    <XAxis type="number" stroke="#8a8a8a" tick={{ fontSize: 11 }}
                      tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="feature" stroke="#8a8a8a" tick={{ fontSize: 11 }} width={160} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                      formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Importancia']}
                      cursor={{ fill: '#ffffff08' }}
                    />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                      {importanceData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {importanceData.map((item, i) => (
                    <div key={item.feature}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: '#f0f0f0' }}>{item.feature}</span>
                        <span style={{ color: COLORS[i % COLORS.length] }}>{item.importance}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ backgroundColor: '#2e2e2e' }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${item.importance}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Conclusions */}
          {model.trained && (
            <Card title="Conclusiones del modelo">
              <div className="space-y-3 text-sm" style={{ color: '#8a8a8a' }}>
                <p>
                  La <strong style={{ color: '#f0f0f0' }}>posición de clasificación</strong> es el predictor más
                  fuerte del resultado final, lo que confirma la importancia de la pole en F1.
                </p>
                {importanceData[1] && (
                  <p>
                    El <strong style={{ color: '#f0f0f0' }}>{importanceData[1].feature.toLowerCase()}</strong> es el
                    segundo factor más influyente ({importanceData[1].importance.toFixed(1)}%), demostrando el
                    impacto real de la estrategia de pitstops.
                  </p>
                )}
                <p>
                  Con un MAE de <strong style={{ color: '#e10600' }}>±{model.cv_mae?.toFixed(2)} posiciones</strong>,
                  el modelo puede identificar patrones significativos en las estrategias ganadoras.
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
