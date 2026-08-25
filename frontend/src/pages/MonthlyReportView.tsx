import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  Dumbbell,
  Footprints,
  Repeat,
  TrendingUp,
  Trophy,
  Waves,
  Weight,
} from 'lucide-react'
import { analyticsApi, MonthlySummary } from '../lib/api'

function formatRange(start?: string, end?: string) {
  if (!start || !end) return '—'
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
  return `${fmt(start)} → ${fmt(end)}`
}

function formatMonthLabel(start?: string) {
  if (!start) return '—'
  return new Date(start).toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  })
}

interface SummaryTile {
  icon: React.ReactNode
  label: string
  value: string | number
  tone: 'pool' | 'mint' | 'navy' | 'amber'
  hint?: string
}

const tones: Record<SummaryTile['tone'], string> = {
  pool: 'bg-pool-50 text-pool-700',
  mint: 'bg-mint-500/10 text-mint-600',
  navy: 'bg-navy-100 text-navy-700',
  amber: 'bg-amber-50 text-amber-700',
}

function Tile({ icon, label, value, tone, hint }: SummaryTile) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-navy-700/60 font-semibold">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1 leading-none">
          {value}
        </p>
        {hint && <p className="text-xs text-navy-700/60 mt-1.5">{hint}</p>}
      </div>
    </div>
  )
}

export function MonthlyReportView() {
  const [data, setData] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    analyticsApi
      .monthlySummary()
      .then((res) => alive && setData(res.data))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const swimmingKm = data ? data.total_swim_m / 1000 : 0

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-navy-700/70 hover:text-pool-700 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao resumo semanal
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Relatório Mensal
          </h1>
          <p className="text-sm text-navy-700/70 mt-1">
            Como te moveste este mês — água, peso e progresso.
          </p>
          {data && (
            <p className="text-xs text-navy-700/60 mt-1.5 inline-flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint-500" />
              <strong className="text-navy-700/80 capitalize">
                {formatMonthLabel(data.month_start)}
              </strong>
              <span className="text-navy-700/40">·</span>
              <span>{formatRange(data.month_start, data.month_end)}</span>
            </p>
          )}
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-navy-700/50">A carregar…</p>
      ) : !data ? (
        <div className="card p-8 text-center text-navy-700/60">
          Não foi possível carregar o relatório.
        </div>
      ) : (
        <>
          {/* TILES PRINCIPAIS */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Tile
              icon={<Activity className="w-5 h-5" />}
              label="Treinos"
              value={data.total_workouts}
              hint="No mês"
              tone="pool"
            />
            <Tile
              icon={<Dumbbell className="w-5 h-5" />}
              label="Séries (Ginásio)"
              value={data.total_gym_sets}
              tone="pool"
            />
            <Tile
              icon={<Repeat className="w-5 h-5" />}
              label="Reps (Ginásio)"
              value={data.total_gym_reps}
              tone="pool"
            />
            <Tile
              icon={<Waves className="w-5 h-5" />}
              label="Natação (m)"
              value={data.total_swim_m.toLocaleString('pt-PT')}
              hint={`${swimmingKm.toFixed(2)} km em água`}
              tone="mint"
            />
            <Tile
              icon={<Footprints className="w-5 h-5" />}
              label="Eq. Corrida"
              value={`${data.running_equivalent_km.toFixed(1)} km`}
              hint="1 km natação ≈ 4 km corrida"
              tone="mint"
            />
            <Tile
              icon={<Trophy className="w-5 h-5" />}
              label="Peso máximo"
              value={
                data.max_weight_kg !== null
                  ? `${data.max_weight_kg.toFixed(1)} kg`
                  : '—'
              }
              hint={
                data.max_weight_kg !== null
                  ? 'Carga mais pesada este mês'
                  : 'Regista peso nos treinos para aparecer aqui'
              }
              tone="amber"
            />
          </section>

          {/* BREAKDOWN POR SEMANA */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-900">Por semana</h3>
              <span className="text-xs text-navy-700/60">
                {data.weeks.length} semana(s) no mês
              </span>
            </div>

            {data.weeks.length === 0 ? (
              <p className="text-sm text-navy-700/60">
                Semanas completas só aparecem quando há treinos registados.
              </p>
            ) : (
              <ul className="divide-y divide-navy-100">
                {data.weeks.map((w) => (
                  <li
                    key={`${w.week_start}-${w.week_index}`}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl grid place-items-center bg-pool-50 text-pool-700 shrink-0">
                        <span className="text-xs font-bold">S{w.week_index}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900 truncate">
                          Semana {w.week_index}
                        </p>
                        <p className="text-xs text-navy-700/60">
                          {formatRange(w.week_start, w.week_end)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-navy-700/80">
                        <Activity className="w-3.5 h-3.5 text-pool-600" />
                        <span className="font-semibold">{w.total_workouts}</span>
                        <span className="text-navy-700/50 text-xs">treinos</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-navy-700/80">
                        <Dumbbell className="w-3.5 h-3.5 text-pool-600" />
                        <span className="font-semibold">{w.total_gym_sets}</span>
                        <span className="text-navy-700/50 text-xs">séries</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-navy-700/80">
                        <Waves className="w-3.5 h-3.5 text-mint-600" />
                        <span className="font-semibold">
                          {w.total_swim_m.toLocaleString('pt-PT')}
                        </span>
                        <span className="text-navy-700/50 text-xs">m</span>
                      </div>
                      {w.max_weight_kg !== null && (
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Weight className="w-3.5 h-3.5" />
                          <span className="font-semibold">
                            {w.max_weight_kg.toFixed(1)} kg
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-mint-600">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-semibold">
                          {w.running_equivalent_km.toFixed(1)}
                        </span>
                        <span className="text-mint-600/70 text-xs">km eq</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
