import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Dumbbell,
  Footprints,
  PlusCircle,
  Repeat,
  TrendingUp,
  Waves,
} from 'lucide-react'
import { analyticsApi, WeeklySummary, workoutsApi } from '../lib/api'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  hint?: string
  tone?: 'pool' | 'mint' | 'navy'
}

const tones: Record<NonNullable<MetricCardProps['tone']>, string> = {
  pool: 'bg-pool-50 text-pool-700',
  mint: 'bg-mint-500/10 text-mint-600',
  navy: 'bg-navy-100 text-navy-700',
}

function MetricCard({ icon, label, value, hint, tone = 'pool' }: MetricCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-navy-700/60 font-semibold">
          {label}
        </p>
        <p className="text-3xl font-extrabold text-navy-900 mt-1 leading-none">{value}</p>
        {hint && <p className="text-xs text-navy-700/60 mt-1.5">{hint}</p>}
      </div>
    </div>
  )
}

/**
 * Anel de progresso desenhado em SVG puro.
 * - Mostra o "running equivalent" como percentagem de uma meta semanal.
 * - Meta default: 20km equivalentes (ajustável).
 */
function ProgressRing({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const size = 180
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, value / max))
  const dash = circumference * pct
  const remaining = circumference - dash

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${dash} ${remaining}`}
            style={{ transition: 'stroke-dasharray 600ms ease-out' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-navy-900">
            {value.toFixed(1)}
            <span className="text-base text-navy-700/60 font-semibold ml-1">km</span>
          </span>
          <span className="text-xs text-navy-700/60 mt-0.5">de {max} km</span>
        </div>
      </div>

      <div className="flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pool-50 text-pool-700 text-xs font-semibold">
          <Footprints className="w-3.5 h-3.5" />
          Equivalente de Corrida
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mt-3">{label}</h2>
        <p className="text-sm text-navy-700/70 mt-1.5 leading-relaxed">
          Considerando que <strong>1 km de natação ≈ 4 km de corrida</strong> em esforço
          cardiovascular, somamos todo o volume semanal.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-mint-600" />
          <span className="text-navy-700/80">
            <strong className="text-mint-600">{Math.round(pct * 100)}%</strong> da meta
            atingida.
          </span>
        </div>
      </div>
    </div>
  )
}

interface RecentWorkout {
  workout_id: number
  workout_date: string
  workout_type: string
  exercicios_ginasio: unknown[]
  series_natacao: unknown[]
}

export function DashboardView() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [recent, setRecent] = useState<RecentWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const WEEKLY_GOAL_KM = 20

  useEffect(() => {
    let alive = true
    Promise.allSettled([analyticsApi.weeklySummary(), workoutsApi.list()])
      .then(([s, w]) => {
        if (!alive) return
        if (s.status === 'fulfilled') setSummary(s.value.data)
        if (w.status === 'fulfilled') {
          const list = (w.value.data as RecentWorkout[]) ?? []
          setRecent(list.slice(-3).reverse())
        }
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const swimmingKm = summary ? summary.total_swim_m / 1000 : 0
  const runningEq = summary?.running_equivalent_km ?? 0

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Resumo Semanal
          </h1>
          <p className="text-sm text-navy-700/70 mt-1">
            A tua consistência em água e peso, lado a lado.
          </p>
        </div>
        <Link to="/log" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Registar treino
        </Link>
      </header>

      {/* HERO — Running Equivalent */}
      <section className="card p-6 sm:p-8 bg-gradient-to-br from-white to-pool-50/40">
        {loading ? (
          <div className="h-[180px] grid place-items-center text-navy-700/50 text-sm">
            A carregar…
          </div>
        ) : (
          <ProgressRing
            value={runningEq}
            max={WEEKLY_GOAL_KM}
            label={
              runningEq === 0
                ? 'Ainda sem volume esta semana'
                : runningEq >= WEEKLY_GOAL_KM
                  ? 'Meta semanal atingida! 🎉'
                  : 'Continua assim, estás a nadar bem!'
            }
          />
        )}
      </section>

      {/* METRIC CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Dumbbell className="w-5 h-5" />}
          label="Séries (Ginásio)"
          value={summary?.total_gym_sets ?? 0}
          hint="Total acumulado"
          tone="pool"
        />
        <MetricCard
          icon={<Repeat className="w-5 h-5" />}
          label="Repetições"
          value={summary?.total_gym_reps ?? 0}
          hint="Séries executadas"
          tone="pool"
        />
        <MetricCard
          icon={<Waves className="w-5 h-5" />}
          label="Natação (m)"
          value={(summary?.total_swim_m ?? 0).toLocaleString('pt-PT')}
          hint={`${swimmingKm.toFixed(2)} km em água`}
          tone="mint"
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Treinos totais"
          value={summary?.total_workouts ?? 0}
          hint="No histórico"
          tone="navy"
        />
      </section>

      {/* ÚLTIMOS TREINOS */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-900">Últimos treinos</h3>
        </div>

        {loading ? (
          <p className="text-sm text-navy-700/50">A carregar…</p>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-pool-50 text-pool-700 grid place-items-center mb-3">
              <Waves className="w-7 h-7" />
            </div>
            <p className="text-navy-900 font-semibold">Nenhum treino registado</p>
            <p className="text-sm text-navy-700/60 mt-1 mb-4 max-w-xs">
              Começa com qualquer sessão — uma série de agachamentos ou 200m de livres já conta.
            </p>
            <Link to="/log" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              Registar primeiro treino
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-navy-100">
            {recent.map((w) => (
              <li
                key={w.workout_id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl grid place-items-center ${
                      w.workout_type === 'gym'
                        ? 'bg-pool-50 text-pool-700'
                        : 'bg-mint-500/10 text-mint-600'
                    }`}
                  >
                    {w.workout_type === 'gym' ? (
                      <Dumbbell className="w-4 h-4" />
                    ) : (
                      <Waves className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 capitalize">
                      {w.workout_type === 'gym' ? 'Ginásio' : 'Natação'}
                    </p>
                    <p className="text-xs text-navy-700/60">
                      {new Date(w.workout_date).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-navy-700/70">
                  {(w.exercicios_ginasio?.length ?? 0) + (w.series_natacao?.length ?? 0)}{' '}
                  {w.workout_type === 'gym' ? 'exercícios' : 'séries'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
