import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Activity, TrendingUp, Waves, Dumbbell } from 'lucide-react'
import { analyticsApi } from '../lib/api'

export function AnalyticsDashboardView() {
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrends() {
      try {
        const { data } = await analyticsApi.trends()
        setTrends(data)
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    fetchTrends()
  }, [])

  if (loading) {
    return (
      <div className="h-full grid place-items-center text-navy-700/50">
        A carregar tendências...
      </div>
    )
  }

  if (trends.length === 0) {
    return (
      <div className="h-full grid place-items-center text-center py-20">
        <Activity className="w-12 h-12 text-navy-200 mb-4" />
        <p className="text-navy-900 font-semibold">Sem dados para analisar</p>
        <p className="text-sm text-navy-700/60">Regista mais treinos para ver a tua evolução.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Analytics Avançado
        </h1>
        <p className="text-sm text-navy-700/70 mt-1">
          Acompanha a tua evolução de força e volume nos últimos 12 meses.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VOLUME CHART */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-mint-600" />
            <h3 className="font-bold text-navy-900">Volume de Treino (Séries)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="volume" fill="#2dd4bf" radius={[4, 4, 0, 0]} name="Séries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* MAX WEIGHT CHART */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Dumbbell className="w-5 h-5 text-pool-600" />
            <h3 className="font-bold text-navy-900">Força Máxima (kg)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="max_weight"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0ea5e9' }}
                  activeDot={{ r: 6 }}
                  name="Peso Máx"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* SWIM VOLUME CHART */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Waves className="w-5 h-5 text-pool-600" />
            <h3 className="font-bold text-navy-900">Volume de Natação (m)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="stepAfter"
                  dataKey="swim_m"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#22d3ee' }}
                  name="Distância Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
